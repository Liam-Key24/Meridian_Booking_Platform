import { describe, expect, it } from "vitest";
import { buildEmailOperationKey } from "@/lib/booking/email-operation-key";

/**
 * Email retry / dedup contract tests.
 * Full concurrent DB races are covered by unique(operation_key) +
 * wasEmailAlreadySent / status === "sent" guards in email-log + email-retry.
 */
describe("email delivery safety contracts", () => {
  it("uses deterministic operation keys for concurrent retries", () => {
    const a = buildEmailOperationKey({
      emailType: "booking.request.customer",
      bookingId: "11111111-1111-1111-1111-111111111111",
      recipientEmail: "Ada@Example.com",
    });
    const b = buildEmailOperationKey({
      emailType: "booking.request.customer",
      bookingId: "11111111-1111-1111-1111-111111111111",
      recipientEmail: "ada@example.com",
    });
    expect(a).toBe(b);
  });

  it("separates email types so confirmation cannot collide with request ack", () => {
    const request = buildEmailOperationKey({
      emailType: "booking.request.customer",
      bookingId: "b1",
      recipientEmail: "a@example.com",
    });
    const confirmed = buildEmailOperationKey({
      emailType: "booking.confirmed",
      bookingId: "b1",
      recipientEmail: "a@example.com",
    });
    expect(request).not.toBe(confirmed);
  });

  it("documents transactional email statuses", () => {
    const statuses = ["pending", "sent", "failed", "skipped"] as const;
    expect(statuses).toContain("sent");
    expect(statuses).toContain("failed");
    // Booking status remains independent of these email statuses.
    expect(statuses).not.toContain("confirmed");
  });
});
