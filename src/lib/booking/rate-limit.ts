import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRateLimitHmacSecret } from "@/lib/booking/rate-limit-keys";

export type RateLimitResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rate_limited" | "unavailable";
      retryAfterSeconds?: number;
    };

type Bucket = { timestamps: number[] };

/** In-memory fallback for local/dev when Upstash is not configured. */
const memoryBuckets = new Map<string, Bucket>();

const limiterCache = new Map<string, Ratelimit>();

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function windowToDuration(windowMs: number): `${number} ms` {
  return `${Math.max(1, Math.floor(windowMs))} ms`;
}

function getLimiter(options: {
  limit: number;
  windowMs: number;
  redis: Redis;
}): Ratelimit {
  const cacheKey = `${options.limit}:${options.windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: options.redis,
    limiter: Ratelimit.slidingWindow(
      options.limit,
      windowToDuration(options.windowMs),
    ),
    prefix: "meridian:rl",
    analytics: false,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

/**
 * Durable rate limiter via @upstash/ratelimit (sliding window).
 *
 * Production:
 * - Requires Upstash URL + token and BOOKING_RATE_LIMIT_SECRET.
 * - Missing config or Redis failures fail closed (generic unavailable).
 *
 * Local/dev without Upstash:
 * - Explicit in-memory sliding window (single process only).
 *
 * Keys must already be HMAC-hashed identifiers — never pass raw IPs/emails.
 */
export async function assertWithinRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (!getRateLimitHmacSecret()) {
    if (isProduction()) {
      return { ok: false, reason: "unavailable" };
    }
  }

  const redis = getRedis();

  if (!redis) {
    if (isProduction()) {
      return { ok: false, reason: "unavailable" };
    }
    return assertWithMemory(options);
  }

  try {
    const limiter = getLimiter({
      limit: options.limit,
      windowMs: options.windowMs,
      redis,
    });
    const result = await limiter.limit(options.key);
    if (!result.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      return { ok: false, reason: "rate_limited", retryAfterSeconds };
    }
    return { ok: true };
  } catch {
    if (isProduction()) {
      return { ok: false, reason: "unavailable" };
    }
    // Local/dev: fall back to memory if Redis throws
    return assertWithMemory(options);
  }
}

function assertWithMemory(options: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(options.key) ?? { timestamps: [] };
  const recent = existing.timestamps.filter(
    (ts) => now - ts < options.windowMs,
  );

  if (recent.length >= options.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((options.windowMs - (now - oldest)) / 1000),
    );
    memoryBuckets.set(options.key, { timestamps: recent });
    return { ok: false, reason: "rate_limited", retryAfterSeconds };
  }

  recent.push(now);
  memoryBuckets.set(options.key, { timestamps: recent });
  return { ok: true };
}

/** Test helper — clears in-memory buckets between tests. */
export function __resetMemoryRateLimitForTests(): void {
  memoryBuckets.clear();
  limiterCache.clear();
}
