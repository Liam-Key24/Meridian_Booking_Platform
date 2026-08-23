import { afterEach, describe, expect, it, vi } from "vitest";
import { validateExternalBookingUrl } from "@/lib/booking/external-url";
import { buildEmailOperationKey } from "@/lib/booking/email-operation-key";
import {
  buildEmailRateLimitKey,
  buildIpRateLimitKey,
  hashRateLimitIdentifier,
} from "@/lib/booking/rate-limit-keys";
import {
  __resetMemoryRateLimitForTests,
  assertWithinRateLimit,
} from "@/lib/booking/rate-limit";
import { verifyTurnstileToken } from "@/lib/booking/turnstile";

describe("validateExternalBookingUrl", () => {
  it("accepts https URLs", () => {
    const result = validateExternalBookingUrl("https://book.example.com/path");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toContain("https://");
  });

  it("rejects javascript and data URLs", () => {
    expect(validateExternalBookingUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateExternalBookingUrl("data:text/html,hi").ok).toBe(false);
    expect(validateExternalBookingUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("rejects http except localhost in development", () => {
    expect(validateExternalBookingUrl("http://evil.example").ok).toBe(false);
    const local = validateExternalBookingUrl("http://localhost:3000/book", {
      allowLocalhost: true,
    });
    expect(local.ok).toBe(true);
  });

  it("rejects malformed URLs", () => {
    expect(validateExternalBookingUrl("not a url").ok).toBe(false);
  });
});

describe("rate limit keys", () => {
  it("hashes identifiers so raw IP/email are not in keys", () => {
    const ipKey = buildIpRateLimitKey("business-a", "203.0.113.10");
    const emailKey = buildEmailRateLimitKey("business-a", "Ada@Example.com");
    expect(ipKey).not.toContain("203.0.113.10");
    expect(emailKey).not.toContain("ada@example.com");
    expect(emailKey).toContain(hashRateLimitIdentifier("Ada@Example.com"));
  });
});

describe("durable rate limit (memory fallback)", () => {
  afterEach(() => {
    __resetMemoryRateLimitForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows requests under the limit and blocks over the limit", async () => {
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
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("email operation keys", () => {
  it("builds deterministic keys for duplicate prevention", () => {
    const a = buildEmailOperationKey({
      emailType: "booking.confirmed",
      bookingId: "b-1",
      recipientEmail: "Ada@Example.com",
    });
    const b = buildEmailOperationKey({
      emailType: "booking.confirmed",
      bookingId: "b-1",
      recipientEmail: "ada@example.com",
    });
    expect(a).toBe(b);
    expect(a).toBe("booking.confirmed:b-1:ada@example.com");
  });
});

describe("Turnstile verification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.BOOKING_TURNSTILE_BYPASS;
  });

  it("fails closed when secret is set and token is missing", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const result = await verifyTurnstileToken("");
    expect(result.ok).toBe(false);
  });

  it("fails closed when Cloudflare rejects the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      }),
    );
    const result = await verifyTurnstileToken("invalid-token-value");
    expect(result.ok).toBe(false);
  });

  it("allows documented local bypass when secret is unset", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken(null);
    expect(result.ok).toBe(true);
  });
});
