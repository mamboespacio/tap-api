import crypto from "crypto";

export function verifyMPSignature(
  secret: string,
  xSignature: string,
  xRequestId: string,
  dataId: string,
): boolean {
  const parts = xSignature.split(",");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const v1Part = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !v1Part) return false;

  const ts = tsPart.slice(3);
  const v1 = v1Part.slice(3);
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}
