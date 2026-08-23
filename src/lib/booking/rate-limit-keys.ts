import { createHash } from "node:crypto";

/**
 * Hash sensitive rate-limit identifiers so raw IPs/emails are never stored
 * in Redis keys or logs.
 */
export function hashRateLimitIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
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
