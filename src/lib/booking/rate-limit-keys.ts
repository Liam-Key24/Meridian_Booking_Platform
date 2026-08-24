import { createHmac, timingSafeEqual } from "node:crypto";

const LOCAL_DEV_HMAC_SECRET = "meridian-local-dev-rate-limit-secret";

/**
 * Server-side HMAC secret for rate-limit identifiers.
 * Production requires BOOKING_RATE_LIMIT_SECRET (fail closed upstream).
 * Local/dev may omit it and use an explicit non-production default.
 */
export function getRateLimitHmacSecret(): string | null {
  const configured = process.env.BOOKING_RATE_LIMIT_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return LOCAL_DEV_HMAC_SECRET;
}

/**
 * HMAC-SHA256 hash of a rate-limit identifier.
 * Never store raw IPs/emails in Redis keys or logs.
 */
export function hashRateLimitIdentifier(value: string): string {
  const secret = getRateLimitHmacSecret();
  if (!secret) {
    throw new Error("BOOKING_RATE_LIMIT_SECRET is required in production");
  }
  return createHmac("sha256", secret)
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function buildIpRateLimitKey(businessSlug: string, ip: string): string {
  return `rl:book:ip:${businessSlug}:${hashRateLimitIdentifier(ip)}`;
}

export function buildEmailRateLimitKey(
  businessSlug: string,
  email: string,
): string {
  return `rl:book:email:${businessSlug}:${hashRateLimitIdentifier(email)}`;
}

/** Test helper — compare two digests without leaking timing. */
export function digestsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
