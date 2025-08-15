import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        products: {
          include: { product: true },
        },
        user: true,
        vendor: true,
      },
    });

    if (!order) {
      return new Response(JSON.stringify({ error: "Orden no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Inicializar cliente con accessToken del vendedor
    const client = new MercadoPagoConfig({
      accessToken: order.vendor.mercadoPagoAccessToken!,
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

    const total = items.reduce(
      (acc, item) => acc + item.unit_price * item.quantity,
      0
    );

    const appCommission = Math.round(total * 0.1); // 10%

    const preference = await new Preference(client).create({
      body: {
        items,
        payer: {
          email: order.user.email ?? undefined,
        },
        back_urls: {
          success: "https://tu-dominio.com/pago-exitoso",
          failure: "https://tu-dominio.com/pago-fallido",
          pending: "https://tu-dominio.com/pago-pendiente",
        },
        auto_return: "approved",
        external_reference: orderId.toString(),
        marketplace: "Tap",
        marketplace_fee: appCommission,
      },
    });

    // Guardar preferenceId en la orden
    await db.order.update({
      where: { id: orderId },
      data: {
        preferenceId: preference.id,
      },
    });

    return new Response(
      JSON.stringify({ preferenceId: preference.id, order }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error en start-payment:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
