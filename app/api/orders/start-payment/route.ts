// app/api/orders/start-payment/route.ts (CORREGIDO)

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { authenticateUser, corsHeaders } from "@/lib/authHelper";
import { getValidMercadoPagoAccessToken } from "@/lib/mp-oauth";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof Response) return authResult;
    const user = authResult;

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId es requerido" }, { status: 400, headers: corsHeaders });
    }

    const order = await db.order.findUnique({
      where: { id: orderId, profile_id: user.id },
      include: { products: { include: { product: true } }, profile: true, vendor: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada o no pertenece al usuario" }, { status: 404, headers: corsHeaders });
    }

    const accessToken = await getValidMercadoPagoAccessToken(order.vendor.id);
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 },
    });

    const items = order.products.map((item) => ({
      id: item.product.id.toString(),
      title: item.product.name,
      description: item.product.description || "",
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: Number(item.product.price),
    }));

    // ... lógica de cálculo de comisión ...
    const total = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const appCommission = Math.round(total * 0.1);

    // 5. Crear preferencia de MP
    const preference = await new Preference(client).create({
      body: {
        items,
        payer: { email: order.profile.email ?? undefined },
        back_urls: { /* ... urls de retorno ... */ },
        auto_return: "approved",
        external_reference: orderId.toString(),
        marketplace: "Tap",
        marketplace_fee: appCommission,
      },
    });

    // 6. Guardar preferenceId
    await db.order.update({
      where: { id: orderId },
      data: { preference_id: preference.id },
    });

    // 7. AÑADIR LA URL DE PAGO A LA RESPUESTA
    let mpUrl: string | undefined;
    
    // Si estás en producción, usa init_point, si estás en test, usa sandbox_init_point
    if (process.env.NODE_ENV === 'production') {
        mpUrl = preference.init_point;
    } else {
        mpUrl = preference.sandbox_init_point;
    }
    
    if (!mpUrl) {
       return NextResponse.json(
            { error: "No se pudo generar el link de pago de Mercado Pago" }, 
            { status: 500, headers: corsHeaders }
        ); 
    }

    return NextResponse.json(
        // Devolvemos la URL que el frontend espera
        { preference_id: preference.id, order, mp_url: mpUrl }, 
        { status: 200, headers: corsHeaders }
    );
    
  } catch (error: any) {
    console.error("Error en start-payment:", error);
    return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500, headers: corsHeaders }
    );
  }
}
