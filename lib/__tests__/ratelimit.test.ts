import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Reset module between tests so the store Map is fresh each describe block.
// We use vi.useFakeTimers to control Date.now().

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function getRL() {
    const { rateLimit } = await import("@/lib/ratelimit");
    return rateLimit;
  }

  it("allows requests up to the max limit", async () => {
    const rateLimit = await getRL();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("key:a", 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const rateLimit = await getRL();
    for (let i = 0; i < 5; i++) rateLimit("key:b", 5, 60_000);
    expect(rateLimit("key:b", 5, 60_000).allowed).toBe(false);
  });

  it("returns remaining count correctly", async () => {
    const rateLimit = await getRL();
    expect(rateLimit("key:c", 3, 60_000).remaining).toBe(2);
    expect(rateLimit("key:c", 3, 60_000).remaining).toBe(1);
    expect(rateLimit("key:c", 3, 60_000).remaining).toBe(0);
  });

  it("resets after the window expires", async () => {
    const rateLimit = await getRL();
    for (let i = 0; i < 3; i++) rateLimit("key:d", 3, 60_000);
    expect(rateLimit("key:d", 3, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(rateLimit("key:d", 3, 60_000).allowed).toBe(true);
  });

  it("tracks different keys independently", async () => {
    const rateLimit = await getRL();
    for (let i = 0; i < 3; i++) rateLimit("key:e1", 3, 60_000);
    expect(rateLimit("key:e1", 3, 60_000).allowed).toBe(false);
    expect(rateLimit("key:e2", 3, 60_000).allowed).toBe(true);
  });

  it("returns retryAfterMs > 0 when blocked", async () => {
    const rateLimit = await getRL();
    for (let i = 0; i < 2; i++) rateLimit("key:f", 2, 60_000);
    const result = rateLimit("key:f", 2, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
