import { describe, expect, it } from "vitest";
import { validateBookingRequest } from "../src/lib/booking/validation";

const tomorrow = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
})();

const base = {
  businessSlug: "business-a",
  customerName: "Sam Taylor",
  customerEmail: "sam@example.com",
  customerPhone: "+447700900111",
  serviceId: "c1111111-1111-4111-8111-111111111111",
  preferredDate: tomorrow,
  preferredTime: "10:30",
  guestCount: "2",
  notes: "Window seat",
  allergies: "",
  noAllergies: false,
  privacyConsent: true,
  companyWebsite: "",
};

describe("validateBookingRequest", () => {
  it("accepts a valid request", () => {
    const result = validateBookingRequest(base);
    expect(result.ok).toBe(true);
  });

  it("rejects honeypot fills as a generic failure", () => {
    const result = validateBookingRequest({
      ...base,
      companyWebsite: "https://spam.test",
    });
    expect(result.ok).toBe(false);
  });

  it("requires privacy consent", () => {
    const result = validateBookingRequest({
      ...base,
      privacyConsent: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/privacy/i);
    }
  });

  it("requires a phone number", () => {
    const result = validateBookingRequest({
      ...base,
      customerPhone: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validateBookingRequest({
      ...base,
      customerEmail: "not-an-email",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts hospitality requests without a service", () => {
    const result = validateBookingRequest(
      { ...base, serviceId: "", noAllergies: true },
      { requireService: false, requireGuestCount: true },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.serviceId).toBeNull();
      expect(result.data.guestCount).toBe(2);
    }
  });

  it("enforces max party size when provided", () => {
    const result = validateBookingRequest(
      { ...base, guestCount: "8", noAllergies: true },
      { requireService: false, requireGuestCount: true, maxGuestCount: 6 },
    );
    expect(result.ok).toBe(false);
  });

  it("requires allergy declaration for hospitality", () => {
    const result = validateBookingRequest(
      { ...base, serviceId: "" },
      {
        requireService: false,
        requireGuestCount: true,
        requireAllergyDeclaration: true,
      },
    );
    expect(result.ok).toBe(false);
  });
});
