import { describe, expect, it } from "vitest";
import { isPreferredSlotOpen } from "@/lib/booking/opening-hours";

const hours = {
  monday: { open: "09:00", close: "17:00", closed: false },
  tuesday: { open: "09:00", close: "17:00", closed: false },
  wednesday: { open: "09:00", close: "17:00", closed: false },
  thursday: { open: "09:00", close: "17:00", closed: false },
  friday: { open: "09:00", close: "17:00", closed: false },
  saturday: { open: "10:00", close: "14:00", closed: false },
  sunday: { open: "09:00", close: "17:00", closed: true },
};

describe("isPreferredSlotOpen", () => {
  it("accepts a weekday time inside hours", () => {
    const result = isPreferredSlotOpen({
      preferredDate: "2026-08-31",
      preferredTime: "12:00",
      openingHours: hours,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects closed weekdays", () => {
    const result = isPreferredSlotOpen({
      preferredDate: "2026-08-30",
      preferredTime: "12:00",
      openingHours: hours,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects times outside opening hours", () => {
    const result = isPreferredSlotOpen({
      preferredDate: "2026-08-31",
      preferredTime: "18:00",
      openingHours: hours,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects holiday dates", () => {
    const result = isPreferredSlotOpen({
      preferredDate: "2026-08-31",
      preferredTime: "12:00",
      openingHours: hours,
      holidays: [{ date: "2026-08-31", label: "Bank holiday" }],
    });
    expect(result.ok).toBe(false);
  });
});
