// /api/mercadopago/connect.ts

const CLIENT_ID = process.env.MP_CLIENT_ID!;
const REDIRECT_URI = process.env.MP_REDIRECT_URI!;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return new Response("vendorId is required", { status: 400 });
  }

  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${vendorId}`;

  return Response.redirect(authUrl, 302);
}
// This endpoint redirects the user to Mercado Pago's OAuth authorization page
// with the necessary parameters including the vendorId as state.
// The user will be redirected back to the specified REDIRECT_URI after authorization.
// Make sure to handle the callback in your application to process the authorization code.
// The vendorId is used to identify which vendor is connecting their Mercado Pago account.