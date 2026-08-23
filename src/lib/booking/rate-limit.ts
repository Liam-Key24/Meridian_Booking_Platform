import "server-only";

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

/**
 * Simple sliding-window rate limiter for public booking submissions.
 * Keyed by business + IP (or email). Suitable for Phase 2; replace with
 * durable store if running multi-instance production later.
 */
export function assertWithinRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(options.key) ?? { timestamps: [] };
  const recent = existing.timestamps.filter(
    (ts) => now - ts < options.windowMs,
  );

  if (recent.length >= options.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((options.windowMs - (now - oldest)) / 1000),
    );
    buckets.set(options.key, { timestamps: recent });
    return { ok: false, retryAfterSeconds };
  }

  recent.push(now);
  buckets.set(options.key, { timestamps: recent });
  return { ok: true };
}
