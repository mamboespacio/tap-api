// app/api/orders/start-payment/route.ts

export const runtime = 'nodejs'; // Aseguramos runtime Node.js

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { authenticateUser, corsHeaders } from "@/lib/authHelper"; // Usamos helper
import { getValidMercadoPagoAccessToken } from "@/lib/mp-oauth"; // Usamos helper MP

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación del usuario que paga
    const authResult = await authenticateUser();
    if (authResult instanceof Response) return authResult; // 401
    const user = authResult; // El comprador

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId es requerido" }, { status: 400, headers: corsHeaders });
    }

    // 2. Buscar la orden y verificar que pertenece al usuario
    const order = await db.order.findUnique({
      where: { id: orderId, userId: user.id }, // Seguridad: debe ser su orden
      include: {
        products: { include: { product: true } },
        user: true, // Ya tenemos 'user' de authenticateUser, pero lo necesitamos para email MP
        vendor: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada o no pertenece al usuario" }, { status: 404, headers: corsHeaders });
    }

    // 3. Inicializar cliente con accessToken válido del vendedor (usando helper)
    const accessToken = await getValidMercadoPagoAccessToken(order.vendor.id); // Usamos el helper para refrescar si es necesario

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 },
    });

    // 4. Preparar items de MP
    const items = order.products.map((item) => ({
      id: item.product.id.toString(),
      title: item.product.name,
      // ... otros campos como description, quantity, price ...
      description: item.product.description || "",
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: Number(item.product.price),
    }));

    // ... lógica de cálculo de comisión ...
    const total = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const appCommission = Math.round(total * 0.1); // 10%

    // 5. Crear preferencia de MP
    const preference = await new Preference(client).create({
      body: {
        items,
        payer: { email: order.user.email ?? undefined },
        back_urls: { /* ... urls de retorno ... */ },
        auto_return: "approved",
        external_reference: orderId.toString(),
        marketplace: "Tap",
        marketplace_fee: appCommission,
      },
    });

    // 6. Guardar preferenceId en la orden y devolver respuesta consistente
    await db.order.update({
      where: { id: orderId },
      data: { preferenceId: preference.id },
    });

    return NextResponse.json(
        { preferenceId: preference.id, order },
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
