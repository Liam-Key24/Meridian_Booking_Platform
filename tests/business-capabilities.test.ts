import { describe, expect, it } from "vitest";
import {
  chartBookingNoun,
  defaultCapabilitiesForType,
  defaultDashboardModeForType,
  isBusinessType,
  isCapabilityKey,
  membershipLabelForMode,
} from "@/lib/business/capabilities";

describe("business capabilities registry", () => {
  it("maps restaurant to hospitality defaults", () => {
    expect(defaultDashboardModeForType("restaurant")).toBe("hospitality");
    const caps = defaultCapabilitiesForType("restaurant");
    expect(caps.tables).toBe(true);
    expect(caps.allergies).toBe(true);
    expect(caps.staff).toBe(false);
  });

  it("maps barber to appointments defaults", () => {
    expect(defaultDashboardModeForType("barber")).toBe("appointments");
    const caps = defaultCapabilitiesForType("barber");
    expect(caps.tables).toBe(false);
    expect(caps.staff).toBe(true);
    expect(caps.calendar).toBe(true);
  });

  it("uses mode-aware labels", () => {
    expect(membershipLabelForMode("hospitality")).toBe("Hospitality");
    expect(membershipLabelForMode("appointments")).toBe("Appointments");
    expect(chartBookingNoun("appointments").plural).toBe("bookings");
    expect(chartBookingNoun("hospitality").plural).toBe("table bookings");
  });

  it("allow-lists types and capabilities", () => {
    expect(isBusinessType("restaurant")).toBe(true);
    expect(isBusinessType("cafe")).toBe(true);
    expect(isBusinessType("salon")).toBe(false);
    expect(isCapabilityKey("allergies")).toBe(true);
    expect(isCapabilityKey("allergy_notes")).toBe(false);
    expect(isCapabilityKey("payments")).toBe(false);
  });
});
