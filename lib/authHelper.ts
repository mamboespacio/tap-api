// @/lib/authHelper.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
};

export async function authenticateUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = await createClient();

    let user = null;

    if (authHeader?.startsWith("Bearer ")) {
      // --- FLUJO MÓVIL: Validación Directa con Token ---
      const token = authHeader.split(" ")[1]; // Extrae el JWT
      
      // Pasar el token directamente a getUser() es el método más fiable en APIs
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error("Error validando token Bearer:", error.message);
      } else {
        user = data.user;
      }
    } 

    // --- FLUJO WEB: Validación vía Cookies (Si no hubo token Bearer) ---
    if (!user) {
      const { data, error } = await supabase.auth.getUser();
      if (!error) user = data.user;
    }

    // --- RESPUESTA DE ERROR ---
    if (!user) {
      console.error("Autenticación fallida: No se encontró sesión válida.");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    return user;
  } catch (err) {
    console.error("Error crítico en authenticateUser:", err);
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
}
