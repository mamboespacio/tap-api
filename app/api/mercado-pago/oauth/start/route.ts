// app/api/mercado-pago/oauth/start/route.ts
import db from "@/lib/prisma";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function b64url(b: Buffer | string) {
  const s = typeof b === "string" ? Buffer.from(b) : b;
  return s.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = Number(url.searchParams.get("vendorId"));
    if (!vendorId) {
      return new Response("vendorId requerido", { status: 400 });
    }

    // 1️⃣ Validar sesión con Supabase SSR
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?returnTo=/api/mercado-pago/oauth/start${url.search}`,
        },
      });
    }

    // 2️⃣ Validar que el vendor pertenezca al usuario
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.ownerId !== session.user.id) {
      return new Response("Vendor inválido", { status: 403 });
    }

    // 3️⃣ Firmar state
    const stateData = { v: vendorId, t: Date.now() };
    const sig = crypto
      .createHmac("sha256", process.env.OAUTH_STATE_SECRET!)
      .update(JSON.stringify(stateData))
      .digest();

    const state = b64url(Buffer.from(JSON.stringify({ ...stateData, s: b64url(sig) })));

    // 4️⃣ Construir URL de autorización
    const authUrl = new URL("https://auth.mercadopago.com.ar/authorization");
    authUrl.searchParams.set("client_id", process.env.MP_CLIENT_ID!);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", process.env.MP_REDIRECT_URI!);
    authUrl.searchParams.set("state", state);

    return new Response(null, {
      status: 302,
      headers: { Location: authUrl.toString() },
    });
  } catch (err: any) {
    console.error("Error OAuth start:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Error OAuth start" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
