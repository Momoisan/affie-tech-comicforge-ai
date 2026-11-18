interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  maxRequests = Number(process.env.COMICFORGE_RATE_LIMIT_MAX || 30),
  windowMs = Number(process.env.COMICFORGE_RATE_LIMIT_WINDOW_MS || 60_000)
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const next: RateBucket = { count: 1, resetAt: now + windowMs };
    buckets.set(identifier, next);
    return { allowed: true, remaining: Math.max(0, maxRequests - 1), resetAt: next.resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
  };
}
