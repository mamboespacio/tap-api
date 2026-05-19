import { describe, it, expect } from "vitest";
import { b64url, b64urlDecode } from "@/lib/utils";

describe("b64url / b64urlDecode", () => {
  it("round-trips a plain ASCII string", () => {
    const input = '{"v":42,"t":1234567890}';
    expect(b64urlDecode(b64url(Buffer.from(input)))).toBe(input);
  });

  it("produces URL-safe output (no +, /, or = characters)", () => {
    for (let i = 0; i < 50; i++) {
      const result = b64url(Buffer.from(`test-${i}-padding-check`));
      expect(result).not.toMatch(/[+/=]/);
    }
  });

  it("decodes a known encoded value", () => {
    // Base64url of '{"hello":"world"}'
    const encoded = b64url(Buffer.from('{"hello":"world"}'));
    expect(b64urlDecode(encoded)).toBe('{"hello":"world"}');
  });

  it("handles empty input", () => {
    const encoded = b64url(Buffer.from(""));
    expect(b64urlDecode(encoded)).toBe("");
  });
});
