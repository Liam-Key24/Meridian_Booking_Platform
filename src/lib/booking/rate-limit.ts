import { Redis } from "@upstash/redis";

type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

type Bucket = { timestamps: number[] };

/** In-memory fallback for local/dev when Upstash is not configured. */
const memoryBuckets = new Map<string, Bucket>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Durable rate limiter (fixed window via INCR + PEXPIRE).
 *
 * Production: Upstash Redis (multi-instance safe).
 * Local/dev without Upstash: process-local memory sliding window (documented).
 *
 * Keys must already be hashed identifiers — never pass raw IPs/emails.
 */
export async function assertWithinRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    return assertWithRedis(redis, options);
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing in production — using in-memory fallback",
    );
  }

  return assertWithMemory(options);
}

async function assertWithRedis(
  redis: Redis,
  options: { key: string; limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const count = await redis.incr(options.key);
  if (count === 1) {
    await redis.pexpire(options.key, options.windowMs);
  }

  if (count > options.limit) {
    const ttlMs = await redis.pttl(options.key);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((ttlMs > 0 ? ttlMs : options.windowMs) / 1000),
    );
    return { ok: false, retryAfterSeconds };
  }

  return { ok: true };
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
    return { ok: false, retryAfterSeconds };
  }

  recent.push(now);
  memoryBuckets.set(options.key, { timestamps: recent });
  return { ok: true };
}

/** Test helper — clears in-memory buckets between tests. */
export function __resetMemoryRateLimitForTests(): void {
  memoryBuckets.clear();
}
