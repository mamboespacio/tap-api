import db from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateB64 = searchParams.get("state");

    if (!code || !stateB64) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const state = JSON.parse(Buffer.from(stateB64, "base64").toString("utf8"));
    const vendorId = Number(state.v);
    if (!vendorId) {
      return new Response(JSON.stringify({ error: "state inválido" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

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
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt =
      typeof data.expires_in === "number"
        ? new Date(Date.now() + data.expires_in * 1000)
        : null;

    await db.mpAccount.upsert({
      where: { vendorId },
      update: {
        mpUserId: String(data.user_id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        liveMode: !!data.live_mode,
        tokenExpiresAt: expiresAt,
      },
      create: {
        vendorId,
        mpUserId: String(data.user_id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        liveMode: !!data.live_mode,
        tokenExpiresAt: expiresAt,
      },
    });

    return Response.redirect(`${process.env.APP_BASE_URL}/seller/linked?vendorId=${vendorId}`);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Error callback" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
