import "server-only";

/**
 * Trusted client IP resolution for rate limiting and Turnstile `remoteip`.
 *
 * Assumptions (documented in docs/operations.md and docs/cloudflare.md):
 * - When TRUSTED_PROXY=cloudflare, the app sits behind Cloudflare's proxy and
 *   `CF-Connecting-IP` is set by Cloudflare (not the client).
 * - When TRUSTED_PROXY=vercel, Vercel terminates TLS and sets
 *   `x-vercel-forwarded-for` / `x-real-ip` from the connecting client.
 * - Never trust the leftmost `x-forwarded-for` value — clients can spoof it
 *   unless a trusted proxy overwrites or appends after the client.
 *
 * Raw addresses must never be logged. Hash before Redis keys.
 */

export type TrustedProxy = "cloudflare" | "vercel" | "none";

export type ClientIpResult = {
  /** Client IP when resolved from a trusted source; otherwise null. */
  ip: string | null;
  source: "cf-connecting-ip" | "x-vercel-forwarded-for" | "x-real-ip" | "none";
};

function readTrustedProxy(): TrustedProxy {
  const raw = (process.env.TRUSTED_PROXY ?? "none").trim().toLowerCase();
  if (raw === "cloudflare" || raw === "vercel" || raw === "none") {
    return raw;
  }
  return "none";
}

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

/** Basic sanity check — reject empty / obviously malformed values. */
export function isPlausibleIp(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 45) return false;
  // Reject header injection / garbage
  if (/[\s"'<>]/.test(trimmed)) return false;
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
    return trimmed.split(".").every((octet) => {
      const n = Number(octet);
      return Number.isInteger(n) && n >= 0 && n <= 255;
    });
  }
  // Loose IPv6 (enough to reject spoof junk; full RFC validation is unnecessary)
  if (trimmed.includes(":") && /^[0-9a-fA-F:.]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Resolve client IP from request headers using the configured trusted proxy.
 * Pass a Headers-like map (Next.js `headers()` or a plain Record).
 */
export function getTrustedClientIp(
  headerStore: Headers | { get(name: string): string | null },
): ClientIpResult {
  const proxy = readTrustedProxy();

  if (proxy === "cloudflare") {
    const cf = firstHeaderValue(headerStore.get("cf-connecting-ip"));
    if (cf && isPlausibleIp(cf)) {
      return { ip: cf, source: "cf-connecting-ip" };
    }
    // Do not fall through to spoofable XFF when Cloudflare is expected.
    return { ip: null, source: "none" };
  }

  if (proxy === "vercel") {
    const vercel = firstHeaderValue(headerStore.get("x-vercel-forwarded-for"));
    if (vercel && isPlausibleIp(vercel)) {
      return { ip: vercel, source: "x-vercel-forwarded-for" };
    }
    const realIp = firstHeaderValue(headerStore.get("x-real-ip"));
    if (realIp && isPlausibleIp(realIp)) {
      return { ip: realIp, source: "x-real-ip" };
    }
    return { ip: null, source: "none" };
  }

  // TRUSTED_PROXY=none — ignore client-controlled forwarding headers.
  return { ip: null, source: "none" };
}
