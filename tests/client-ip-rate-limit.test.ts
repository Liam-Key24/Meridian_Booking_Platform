import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTrustedClientIp,
  isPlausibleIp,
} from "@/lib/server/client-ip";
import {
  buildEmailRateLimitKey,
  buildIpRateLimitKey,
  hashRateLimitIdentifier,
} from "@/lib/booking/rate-limit-keys";
import {
  __resetMemoryRateLimitForTests,
  assertWithinRateLimit,
} from "@/lib/booking/rate-limit";

function headerMap(entries: Record<string, string>) {
  const lower = new Map(
    Object.entries(entries).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    get(name: string) {
      return lower.get(name.toLowerCase()) ?? null;
    },
  };
}

describe("trusted client IP", () => {
  afterEach(() => {
    delete process.env.TRUSTED_PROXY;
  });

  it("prefers CF-Connecting-IP when TRUSTED_PROXY=cloudflare", () => {
    process.env.TRUSTED_PROXY = "cloudflare";
    const result = getTrustedClientIp(
      headerMap({
        "cf-connecting-ip": "203.0.113.50",
        "x-forwarded-for": "198.51.100.1, 203.0.113.50",
      }),
    );
    expect(result).toEqual({
      ip: "203.0.113.50",
      source: "cf-connecting-ip",
    });
  });

  it("ignores spoofed X-Forwarded-For when Cloudflare is trusted", () => {
    process.env.TRUSTED_PROXY = "cloudflare";
    const result = getTrustedClientIp(
      headerMap({
        "x-forwarded-for": "198.51.100.9",
      }),
    );
    expect(result.ip).toBeNull();
    expect(result.source).toBe("none");
  });

  it("does not trust leftmost X-Forwarded-For when TRUSTED_PROXY=none", () => {
    process.env.TRUSTED_PROXY = "none";
    const result = getTrustedClientIp(
      headerMap({
        "x-forwarded-for": "198.51.100.1",
        "x-real-ip": "198.51.100.2",
      }),
    );
    expect(result.ip).toBeNull();
  });

  it("uses Vercel forwarded header when TRUSTED_PROXY=vercel", () => {
    process.env.TRUSTED_PROXY = "vercel";
    const result = getTrustedClientIp(
      headerMap({
        "x-vercel-forwarded-for": "203.0.113.77",
        "x-forwarded-for": "198.51.100.1, 203.0.113.77",
      }),
    );
    expect(result).toEqual({
      ip: "203.0.113.77",
      source: "x-vercel-forwarded-for",
    });
  });

  it("rejects malformed IP values", () => {
    expect(isPlausibleIp("not-an-ip")).toBe(false);
    expect(isPlausibleIp("999.999.999.999")).toBe(false);
    expect(isPlausibleIp('1.2.3.4"')).toBe(false);
    expect(isPlausibleIp("203.0.113.10")).toBe(true);
  });
});

describe("HMAC rate-limit keys", () => {
  afterEach(() => {
    delete process.env.BOOKING_RATE_LIMIT_SECRET;
  });

  it("hashes with HMAC secret and never embeds raw IP/email", () => {
    process.env.BOOKING_RATE_LIMIT_SECRET = "test-secret-at-least-16";
    const ipKey = buildIpRateLimitKey("business-a", "203.0.113.10");
    const emailKey = buildEmailRateLimitKey("business-a", "Ada@Example.com");
    expect(ipKey).not.toContain("203.0.113.10");
    expect(emailKey).not.toContain("ada@example.com");
    expect(emailKey).toContain(hashRateLimitIdentifier("Ada@Example.com"));

    const expected = createHmac("sha256", "test-secret-at-least-16")
      .update("ada@example.com")
      .digest("hex");
    expect(hashRateLimitIdentifier("Ada@Example.com")).toBe(expected);

    const unsalted = createHash("sha256")
      .update("ada@example.com")
      .digest("hex");
    expect(hashRateLimitIdentifier("Ada@Example.com")).not.toBe(unsalted);
  });
});

describe("durable rate limit", () => {
  afterEach(() => {
    __resetMemoryRateLimitForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.BOOKING_RATE_LIMIT_SECRET;
    vi.unstubAllEnvs();
  });

  it("allows under the limit and blocks over the limit (memory)", async () => {
    process.env.BOOKING_RATE_LIMIT_SECRET = "test-secret-at-least-16";
    const key = "rl:test:memory";
    for (let i = 0; i < 3; i += 1) {
      const result = await assertWithinRateLimit({
        key,
        limit: 3,
        windowMs: 60_000,
      });
      expect(result.ok).toBe(true);
    }
    const blocked = await assertWithinRateLimit({
      key,
      limit: 3,
      windowMs: 60_000,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe("rate_limited");
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("fails closed in production when Upstash is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.BOOKING_RATE_LIMIT_SECRET = "test-secret-at-least-16";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await assertWithinRateLimit({
      key: "rl:test:prod-missing",
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("fails closed in production when rate-limit secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.BOOKING_RATE_LIMIT_SECRET;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const result = await assertWithinRateLimit({
      key: "rl:test:prod-no-secret",
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("fails closed in production when Redis throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.BOOKING_RATE_LIMIT_SECRET = "test-secret-at-least-16";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("redis down")),
    );

    const result = await assertWithinRateLimit({
      key: "rl:test:prod-redis-fail",
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });
});
