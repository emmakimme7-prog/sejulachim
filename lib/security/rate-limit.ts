import "server-only";

type Entry = {
  count: number;
  resetAt: number;
};

const store = globalThis.__rateLimitStore ?? new Map<string, Entry>();
globalThis.__rateLimitStore = store;

declare global {
  var __rateLimitStore: Map<string, Entry> | undefined;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}
