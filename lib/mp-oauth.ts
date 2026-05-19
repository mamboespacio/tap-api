import db from "@/lib/prisma";

// Per-vendor dedup map: if a refresh is already in flight for a vendor,
// subsequent callers await the same promise instead of racing to MP's token endpoint
// (MP invalidates the previous refresh_token on each use).
const refreshing = new Map<number, Promise<string>>();

export async function getValidMercadoPagoAccessToken(vendor_id: number): Promise<string> {
  const mpAccount = await db.mpAccount.findUnique({ where: { vendor_id } });

  if (!mpAccount) {
    throw new Error("Cuenta de Mercado Pago no vinculada para este vendedor.");
  }

  const EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

  if (
    !mpAccount.token_expires_at ||
    mpAccount.token_expires_at.getTime() < Date.now() + EXPIRATION_BUFFER_MS
  ) {
    if (!mpAccount.refresh_token) {
      throw new Error("No hay refresh token disponible para renovar el acceso.");
    }

    const inFlight = refreshing.get(vendor_id);
    if (inFlight) return inFlight;

    const promise = refreshMercadoPagoTokens(mpAccount.refresh_token, vendor_id)
      .then((data) => data.access_token as string)
      .finally(() => refreshing.delete(vendor_id));

    refreshing.set(vendor_id, promise);
    return promise;
  }

  return mpAccount.access_token;
}

async function refreshMercadoPagoTokens(refresh_token: string, vendor_id: number) {
  if (!process.env.MP_CLIENT_ID || !process.env.MP_CLIENT_SECRET) {
    throw new Error("Faltan variables de entorno para Mercado Pago.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.MP_CLIENT_ID,
    client_secret: process.env.MP_CLIENT_SECRET,
    refresh_token,
  });

  const r = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await r.json();

  if (!r.ok) {
    console.error("Error al refrescar tokens de MP:", data);
    throw new Error(`Fallo al refrescar token: ${data.message || "Error desconocido"}`);
  }

  const expires_at =
    typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

  await db.mpAccount.update({
    where: { vendor_id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refresh_token,
      token_expires_at: expires_at,
    },
  });

  return data;
}
