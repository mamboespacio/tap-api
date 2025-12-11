// lib/mp-oauth.ts
import db from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Verifica si el token de MP está vigente, si no, lo refresca usando el refresh_token.
 * @param vendor_id El ID del vendedor
 * @returns El accessToken vigente
 */
export async function getValidMercadoPagoAccessToken(vendor_id: number): Promise<string> {
  const mpAccount = await db.mpAccount.findUnique({
    where: { vendor_id },
  });

  if (!mpAccount) {
    throw new Error("Cuenta de Mercado Pago no vinculada para este vendedor.");
  }

  // Define un buffer de tiempo (e.g., 5 minutos antes de expirar) para refrescar proactivamente.
  const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; 

  // Si no hay fecha de expiración o si falta poco tiempo, intentamos refrescar.
  if (
    !mpAccount.token_expires_at ||
    mpAccount.token_expires_at.getTime() < Date.now() + EXPIRATION_BUFFER_MS
  ) {
    if (!mpAccount.refresh_token) {
      throw new Error("No hay refresh token disponible para renovar el acceso.");
    }
    
    console.log(`Refrescando token para vendor ${vendor_id}...`);
    const newTokens = await refreshMercadoPagoTokens(mpAccount.refresh_token, vendor_id);
    return newTokens.access_token;
  }

  // El token actual es válido, lo retornamos.
  return mpAccount.access_token;
}


async function refreshMercadoPagoTokens(refresh_token: string, vendor_id: number) {
  // Asegúrate de que tus variables de entorno estén disponibles aquí.
  if (!process.env.MP_CLIENT_ID || !process.env.MP_CLIENT_SECRET) {
      throw new Error("Faltan variables de entorno para Mercado Pago.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.MP_CLIENT_ID,
    client_secret: process.env.MP_CLIENT_SECRET,
    refresh_token: refresh_token,
  });

  const r = await fetch("api.mercadopago.com", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await r.json();

  if (!r.ok) {
    console.error("Error al refrescar tokens de MP:", data);
    throw new Error(`Fallo al refrescar token: ${data.message || 'Error desconocido'}`);
  }

  // Calcular la nueva fecha de expiración
  const expires_at = typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

  // Actualizar la base de datos con los nuevos tokens
  await db.mpAccount.update({
    where: { vendor_id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refresh_token, // A veces MP devuelve el mismo refresh_token, a veces uno nuevo.
      token_expires_at: expires_at,
      // liveMode y mpUserId no suelen cambiar, no es necesario actualizarlos aquí.
    },
  });

  return data;
}

