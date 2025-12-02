// lib/mp-oauth.ts
import db from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Verifica si el token de MP está vigente, si no, lo refresca usando el refreshToken.
 * @param vendorId El ID del vendedor
 * @returns El accessToken vigente
 */
export async function getValidMercadoPagoAccessToken(vendorId: number): Promise<string> {
  const mpAccount = await db.mpAccount.findUnique({
    where: { vendorId },
  });

  if (!mpAccount) {
    throw new Error("Cuenta de Mercado Pago no vinculada para este vendedor.");
  }

  // Define un buffer de tiempo (e.g., 5 minutos antes de expirar) para refrescar proactivamente.
  const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; 

  // Si no hay fecha de expiración o si falta poco tiempo, intentamos refrescar.
  if (
    !mpAccount.tokenExpiresAt ||
    mpAccount.tokenExpiresAt.getTime() < Date.now() + EXPIRATION_BUFFER_MS
  ) {
    if (!mpAccount.refreshToken) {
      throw new Error("No hay refresh token disponible para renovar el acceso.");
    }
    
    console.log(`Refrescando token para vendor ${vendorId}...`);
    const newTokens = await refreshMercadoPagoTokens(mpAccount.refreshToken, vendorId);
    return newTokens.access_token;
  }

  // El token actual es válido, lo retornamos.
  return mpAccount.accessToken;
}


async function refreshMercadoPagoTokens(refreshToken: string, vendorId: number) {
  // Asegúrate de que tus variables de entorno estén disponibles aquí.
  if (!process.env.MP_CLIENT_ID || !process.env.MP_CLIENT_SECRET) {
      throw new Error("Faltan variables de entorno para Mercado Pago.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.MP_CLIENT_ID,
    client_secret: process.env.MP_CLIENT_SECRET,
    refresh_token: refreshToken,
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
  const expiresAt = typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

  // Actualizar la base de datos con los nuevos tokens
  await db.mpAccount.update({
    where: { vendorId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // A veces MP devuelve el mismo refreshToken, a veces uno nuevo.
      tokenExpiresAt: expiresAt,
      // liveMode y mpUserId no suelen cambiar, no es necesario actualizarlos aquí.
    },
  });

  return data;
}

