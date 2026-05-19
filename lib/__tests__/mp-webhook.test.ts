import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyMPSignature } from "@/lib/mp-webhook";

function buildSignature(secret: string, dataId: string, requestId: string, ts: number): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${hash}`;
}

const SECRET = "super-secret-key";
const DATA_ID = "123456789";
const REQUEST_ID = "req-abc-xyz";
const TS = 1700000000;

describe("verifyMPSignature", () => {
  it("returns true for a correct signature", () => {
    const sig = buildSignature(SECRET, DATA_ID, REQUEST_ID, TS);
    expect(verifyMPSignature(SECRET, sig, REQUEST_ID, DATA_ID)).toBe(true);
  });

  it("returns false when v1 hash is tampered", () => {
    const sig = `ts=${TS},v1=000000000000000000000000000000000000000000000000000000000000dead`;
    expect(verifyMPSignature(SECRET, sig, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false when ts part is missing", () => {
    const manifest = `id:${DATA_ID};request-id:${REQUEST_ID};ts:${TS}`;
    const hash = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
    expect(verifyMPSignature(SECRET, `v1=${hash}`, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false when v1 part is missing", () => {
    expect(verifyMPSignature(SECRET, `ts=${TS}`, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false when the secret is wrong", () => {
    const sig = buildSignature("wrong-secret", DATA_ID, REQUEST_ID, TS);
    expect(verifyMPSignature(SECRET, sig, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false when dataId does not match the signature", () => {
    const sig = buildSignature(SECRET, "other-id", REQUEST_ID, TS);
    expect(verifyMPSignature(SECRET, sig, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false when requestId does not match the signature", () => {
    const sig = buildSignature(SECRET, DATA_ID, "other-req", TS);
    expect(verifyMPSignature(SECRET, sig, REQUEST_ID, DATA_ID)).toBe(false);
  });

  it("returns false for an empty signature string", () => {
    expect(verifyMPSignature(SECRET, "", REQUEST_ID, DATA_ID)).toBe(false);
  });
});
