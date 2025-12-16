export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { corsHeaders } from "@/lib/authHelper";
import { getValidMercadoPagoAccessToken } from "@/lib/mp-oauth";

/**
 * Webhook handler para MercadoPago
 *
 * Estrategia:
 * 1) Extraer posibles ids/identificadores del body / query (id, collection.id, data.id, collection.external_reference, external_reference, preference_id).
 * 2) Si viene external_reference -> buscar orden en DB (orderId) -> obtener token del vendedor -> consultar payment con ese token.
 * 3) Si no viene external_reference -> intentar consultar payment con token global MERCADOPAGO_ACCESS_TOKEN (si existe).
 * 4) Si obtuvimos el payment -> extraer external_reference -> buscar orden -> actualizar.
 *
 * Nota: se recomienda implementar verificación de firma (HMAC) si lo habilitas desde MP.
 */

async function fetchPaymentFromMP(paymentId: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err: any = new Error(`MP fetch failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text().catch(() => "");
    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      // not JSON -> leave body as {}
      console.warn("Webhook MP: body no es JSON parseable", { rawBody });
    }

    const url = new URL(req.url);
    const query = url.searchParams;

    // Extraer posibles identificadores que MP puede enviar
    const candidatePaymentId =
      body?.id ||
      body?.data?.id ||
      body?.collection_id ||
      body?.collection?.id ||
      query.get("id") ||
      null;

    const candidateExternalReference =
      body?.external_reference ||
      body?.collection?.external_reference ||
      body?.data?.external_reference ||
      body?.preference_id ||
      body?.preference?.external_reference ||
      null;

    if (!candidatePaymentId && !candidateExternalReference) {
      console.warn("Webhook MP: no se encontró id ni external_reference en el payload", {
        body,
        query: Object.fromEntries(query.entries()),
      });
      // Devolver 200 para que MP deje de reintentar en caso de payload mal formado
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    let payment: any | null = null;
    let usedTokenForFetch: string | null = null;

    // Si tenemos external_reference, intentar resolver orden y usar token del vendor
    if (candidateExternalReference) {
      const orderIdNum = Number(candidateExternalReference);
      if (!Number.isNaN(orderIdNum)) {
        const order = await db.order.findUnique({
          where: { id: orderIdNum },
          include: { vendor: true },
        });

        if (order) {
          try {
            const vendorToken = await getValidMercadoPagoAccessToken(order.vendor.id);
            payment = await fetchPaymentFromMP(String(candidatePaymentId ?? ""), vendorToken);
            usedTokenForFetch = `vendor:${order.vendor.id}`;
          } catch (err: any) {
            // Si falla la consulta con token del vendor, lo registramos y seguimos intentando con token global
            console.warn("Webhook MP: fallo al consultar MP con token del vendor, intentando token global", {
              vendorId: order.vendor.id,
              err: err?.message ?? err,
            });
          }
        } else {
          console.warn("Webhook MP: external_reference no mapeó a ninguna orden", {
            external_reference: candidateExternalReference,
          });
        }
      }
    }

    // Si no obtuvimos payment aún, intentar con token global de la APP si está configurado
    if (!payment) {
      const APP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (APP_TOKEN) {
        try {
          payment = await fetchPaymentFromMP(String(candidatePaymentId ?? ""), APP_TOKEN);
          usedTokenForFetch = "app:global";
        } catch (err: any) {
          console.error("Webhook MP: no se pudo obtener payment con token global de la app", {
            status: err?.status,
            body: err?.body,
            message: err?.message,
          });
        }
      }
    }

    // Si aún no tenemos payment: intentar observar si el payload incluye suficiente info para buscar por preference_id
    if (!payment && candidateExternalReference) {
      // No pudimos llamar MP; igual intentaremos actualizar la orden según el candidateExternalReference
      // (No ideal: no tenemos el estado real desde MP) -> solo registrar evento
      const orderIdNum = Number(candidateExternalReference);
      // if (!Number.isNaN(orderIdNum)) {
      //   await db.webhookLog?.create?.({
      //     // si tienes tabla de logs; si no, omitir o usa db.$executeRaw para guardar a tu gusto
      //     data: {
      //       order_id: orderIdNum,
      //       raw: rawBody || body,
      //       note: "Recibido webhook MP pero no se pudo obtener payment (sin token disponible)",
      //     } as any,
      //   }).catch(() => {}); // no bloquear por falta de tabla
      // }
      // Responder 200 para evitar reintentos continuos
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    if (!payment) {
      // No pudimos obtener payment de ninguna forma; log y 200 para evitar reintentos infinitos
      console.error("Webhook MP: no se pudo obtener payment con ninguna estrategia", { body });
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    // A partir del payment obtenido, tomar external_reference y buscar la orden
    const externalReference = payment.external_reference ?? payment.preference_id ?? candidateExternalReference ?? null;

    if (!externalReference) {
      console.warn("Webhook MP: payment obtenido sin external_reference ni preference_id", { payment });
      // Guardar raw e ignorar
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    const orderId = Number(externalReference);
    if (Number.isNaN(orderId)) {
      console.warn("Webhook MP: external_reference no es numérica", { externalReference, payment });
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { vendor: true, profile: true },
    });

    if (!order) {
      console.warn("Webhook MP: no se encontró orden para external_reference", { externalReference });
      // Aun así devolvemos 200 para no provocar reintentos infinitos
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }

    // Mapear estado de MercadoPago a tus estados: PENDING, APPROVED, REJECTED, CANCELLED
    let newStatus = order.status;
    const mpStatus: string = (payment.status || "").toString().toLowerCase();
    switch (mpStatus) {
      case "approved":
        newStatus = "APPROVED";
        break;
      case "pending":
      case "in_process":
        newStatus = "PENDING";
        break;
      case "rejected":
        newStatus = "REJECTED";
        break;
      case "cancelled":
      case "refunded":
      case "charged_back":
        newStatus = "CANCELLED";
        break;
      default:
        // dejar el estado tal cual si es un estado no mapeado
        newStatus = order.status;
    }

    // Actualizar la orden con la info del pago
    await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        // payment_status: payment.status ?? null,
        // payment_status_detail: payment.status_detail ?? null,
        payment_id: payment.id?.toString?.() ?? String(candidatePaymentId ?? ""),
        preference_id: payment.preference_id ?? order.preference_id,
        // Guarda el raw para debugging (ajusta el campo según tu esquema; aquí suponemos mp_raw tipo JSON)
        // mp_raw: payment as any,
      },
    });

    // Opcional: si quieres notificar por email/WS al cliente, puedes disparar jobs aquí
    console.info("Webhook MP procesado OK", { orderId, mpStatus, usedTokenForFetch });

    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error procesando webhook MP:", err);
    // Devolver 500 hará que MP reintente; si prefieres evitar reintentos devuelve 200 y loguea
    return NextResponse.json({ error: "error interno al procesar webhook" }, { status: 500, headers: corsHeaders });
  }
}

// Preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}