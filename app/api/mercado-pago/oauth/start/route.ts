// app/api/mercado-pago/oauth/start/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/prisma";
import crypto from "crypto";

function b64url(b: Buffer | string) {
  const s = typeof b === "string" ? Buffer.from(b) : b;
  return s.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const vendorId = Number(u.searchParams.get("vendorId"));
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (!vendorId) return new Response("vendorId requerido", { status: 400 });

  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.ownerId !== Number(session.user.id)) {
    return new Response("Vendor inválido", { status: 403 });
  }

  // Firmar state
  const stateData = { v: vendorId, t: Date.now() };
  const sig = crypto
    .createHmac("sha256", process.env.OAUTH_STATE_SECRET!)
    .update(JSON.stringify(stateData))
    .digest();

  const state = b64url(Buffer.from(JSON.stringify({ ...stateData, s: b64url(sig) })));

  const authUrl = new URL("https://auth.mercadopago.com.ar/authorization");
  authUrl.searchParams.set("client_id", process.env.MP_CLIENT_ID!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", process.env.MP_REDIRECT_URI!);
  authUrl.searchParams.set("state", state);

  return new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
}
