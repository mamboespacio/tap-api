// app/api/mercadopago/oauth/start/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import db from "@/lib/prisma";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { b64url } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = Number(url.searchParams.get("vendorId"));
    if (!vendorId) {
      return new Response("vendorId requerido", { status: 400 });
    }
    
    // ⚠️ Validación de variables de entorno al inicio para prevenir errores en tiempo de ejecución
    const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
    const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
    const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI;
    
    if (!MP_CLIENT_SECRET || !MP_CLIENT_ID || !MP_REDIRECT_URI) {
      console.error("Faltan variables de entorno para la configuración de OAuth de Mercado Pago");
      return new Response(JSON.stringify({ error: "Error de configuración interna" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1️⃣ Validar sesión con Supabase de manera segura
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // ✅ Se usa getUser() para validar la sesión de forma segura

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?returnTo=/api/mercadopago/oauth/start${url.search}`,
        },
      });
    }

    // 2️⃣ Validar que el vendor pertenezca al usuario
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.ownerId !== user.id) { // ✅ Se usa user.id de la validación segura
      return new Response("Vendor inválido", { status: 403 });
    }

    // 3️⃣ Firmar state
    const stateData = { v: vendorId, t: Date.now() };
    const sig = crypto
      .createHmac("sha256", MP_CLIENT_SECRET) // ✅ Se usa la variable validada
      .update(JSON.stringify(stateData))
      .digest();

    const state = b64url(Buffer.from(JSON.stringify({ ...stateData, s: b64url(sig) })));

    // 4️⃣ Construir URL de autorización
    const authUrl = new URL("https://auth.mercadopago.com.ar/authorization");
    authUrl.searchParams.set("client_id", MP_CLIENT_ID); // ✅ Se usa la variable validada
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", MP_REDIRECT_URI); // ✅ Se usa la variable validada
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
