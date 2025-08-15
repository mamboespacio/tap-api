import crypto from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return new Response(JSON.stringify({ error: "vendorId requerido" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const state = Buffer.from(JSON.stringify({
    v: vendorId,
    n: crypto.randomBytes(8).toString("hex"),
  })).toString("base64");

  const params = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.MP_REDIRECT_URI!,
    state,
  });

  return Response.redirect(`https://auth.mercadopago.com/authorization?${params.toString()}`);
}
