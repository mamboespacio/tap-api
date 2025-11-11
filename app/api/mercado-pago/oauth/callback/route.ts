// app/api/mercado-pago/oauth/callback/route.ts
import db from "@/lib/prisma";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function b64urlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  return Buffer.from(input, "base64").toString("utf8");
}

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

    // 1) Validar state firmado
    const raw = JSON.parse(b64urlDecode(stateB64));
    const { v: vendorId, t, s } = raw ?? {};
    if (!vendorId || !t || !s) {
      return new Response(JSON.stringify({ error: "state inválido" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const checkSig = crypto
      .createHmac("sha256", process.env.OAUTH_STATE_SECRET!)
      .update(JSON.stringify({ v: vendorId, t }))
      .digest();
    const okSig = s === Buffer.from(checkSig).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    if (!okSig) {
      return new Response(JSON.stringify({ error: "state no verificado" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // (opcional) validar que hay sesión y que el vendor pertenece al user actual
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // si querés forzar login aquí: redirigí a /login con returnTo
      return new Response(null, {
        status: 302,
        headers: { Location: `/login?returnTo=/api/mercado-pago/oauth/callback${new URL(req.url).search}` },
      });
    }
    const vendor = await db.vendor.findUnique({ where: { id: Number(vendorId) } });
    if (!vendor || vendor.ownerId !== Number(session.user.id)) {
      return new Response(JSON.stringify({ error: "Vendor no pertenece al usuario" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Intercambio de code por tokens
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

    // 3) Redirigir a UI (sesión ya sigue activa)
    return Response.redirect(`${process.env.APP_BASE_URL}/seller/linked?vendorId=${vendorId}`);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Error callback" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
