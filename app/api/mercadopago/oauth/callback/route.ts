export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import db from "@/lib/prisma";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { b64url, b64urlDecode } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateB64 = searchParams.get("state");

    // chequeo que tengo las variables de entorno necesarias
    const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
    const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
    const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET;
    const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI;

    if (!MP_CLIENT_SECRET || !MP_CLIENT_ID || !OAUTH_STATE_SECRET || !MP_REDIRECT_URI) {
      console.error("Faltan variables de entorno para el callback de Mercado Pago");
      return new Response(JSON.stringify({ error: "Error de configuración interna en callback" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!code || !stateB64) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1️⃣ Validar state firmado
    const raw = JSON.parse(b64urlDecode(stateB64));
    const { v: vendorId, t, s } = raw ?? {};

    if (!vendorId || !t || !s) {
      return new Response(JSON.stringify({ error: "state inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const checkSig = crypto
    .createHmac("sha256", OAUTH_STATE_SECRET) 
    .update(JSON.stringify({ v: vendorId, t }))
    .digest();

    const okSig = s === b64url(checkSig);

    if (!okSig) {
      return new Response(JSON.stringify({ error: "state no verificado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2️⃣ Validar sesión y propietario (usando Supabase)
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?returnTo=/api/mercadopago/oauth/callback${new URL(
            req.url
          ).search}`,
        },
      });
    }

    const vendor = await db.vendor.findUnique({
      where: { id: Number(vendorId) },
    });

    if (!vendor || vendor.ownerId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: "Vendor no pertenece al usuario" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3️⃣ Intercambio de code por tokens
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.MP_CLIENT_ID!,
      client_secret: process.env.MP_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.MP_REDIRECT_URI!,
    });

    const r = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await r.json();

    if (!r.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt =
      typeof data.expires_in === "number"
        ? new Date(Date.now() + data.expires_in * 1000)
        : null;

    await db.mpAccount.upsert({
      where: { vendorId: Number(vendorId) },
      update: {
        mpUserId: String(data.user_id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        liveMode: !!data.live_mode,
        tokenExpiresAt: expiresAt,
      },
      create: {
        vendorId: Number(vendorId),
        mpUserId: String(data.user_id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        liveMode: !!data.live_mode,
        tokenExpiresAt: expiresAt,
      },
    });

    // 4️⃣ Redirigir a UI (sesión Supabase sigue activa)
    return Response.redirect(
      `${process.env.APP_BASE_URL}/dashboard`
    );
  } catch (err: any) {
    console.error("Error callback:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Error callback" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
