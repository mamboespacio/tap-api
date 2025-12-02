// app/api/orders/create/route.ts (Ejemplo de uso)

import { getValidMercadoPagoAccessToken } from "@/lib/mp-oauth";

export async function POST(req: Request) {
  const { vendorId, items } = await req.json();

  try {
    // Esto te da un token que está garantizado como válido (refrescado si era necesario)
    const accessToken = await getValidMercadoPagoAccessToken(Number(vendorId));

    // Usa el accessToken para hacer tu llamada a la API de MP
    // const mpResponse = await fetch('...', { headers: { Authorization: `Bearer ${accessToken}` }});

    return new Response(JSON.stringify({ success: true, message: "Operación completada con token válido" }));

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
