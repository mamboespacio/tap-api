// Simple in-memory sliding-window rate limiter.
// Works for single-instance deployments (local dev, single server).
// For Vercel/multi-instance: replace `store` with Upstash Redis (@upstash/ratelimit).

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function prune(now: number) {
  if (store.size > 10_000) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  prune(now);

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 };
}
