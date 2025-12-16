// app/api/orders/start-payment/route.ts (CORREGIDO Y FINAL)

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { authenticateUser, corsHeaders } from "@/lib/authHelper";
import { getValidMercadoPagoAccessToken } from "@/lib/mp-oauth";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req);
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
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404, headers: corsHeaders });
    }

    const accessToken = await getValidMercadoPagoAccessToken(order.vendor.id);
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

    const items = order.products.map((item) => ({
      id: item.product.id.toString(),
      title: item.product.name,
      description: item.product.description || "",
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: Number(item.product.price),
    }));

    const total = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const appCommission = Math.round(total * 0.1);

    // Definir la URL base de tu App/Web
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-sitio.com";

    const preference = await new Preference(client).create({
      body: {
        items,
        payer: { email: order.profile.email ?? undefined },
        // SOLUCIÓN AL ERROR: back_urls obligatorias para auto_return
        back_urls: {
          success: `${baseUrl}/payment/success`,
          failure: `${baseUrl}/payment/failure`,
          pending: `${baseUrl}/payment/pending`,
        },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        auto_return: "approved",
        external_reference: orderId.toString(),
        marketplace: "Tap",
        marketplace_fee: appCommission,
      },
    });

    await db.order.update({
      where: { id: orderId },
      data: { preference_id: preference.id },
    });

    // DETERMINAR LA URL DE PAGO (Vital para tu App Expo)
    const mpUrl = process.env.NODE_ENV === 'production' 
      ? preference.init_point 
      : preference.sandbox_init_point;

    // DEVOLVER LA URL AL FRONTEND
    return NextResponse.json(
        { 
          preference_id: preference.id, 
          mp_url: mpUrl, // <-- Esto es lo que soluciona tu error en CartPage.tsx
          order 
        },
        { status: 200, headers: corsHeaders }
    );
    
  } catch (error: any) {
    console.error("Error en start-payment:", error);
    return NextResponse.json(
        { error: "Error al generar el pago" },
        { status: 500, headers: corsHeaders }
    );
  }
}

// Manejo de pre-flight CORS
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
