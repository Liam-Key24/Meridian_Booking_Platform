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
    expect(caps.table_management).toBe(true);
    expect(caps.allergy_notes).toBe(true);
    expect(caps.staff_assignment).toBe(false);
  });

  it("maps salon to appointments defaults", () => {
    expect(defaultDashboardModeForType("salon")).toBe("appointments");
    const caps = defaultCapabilitiesForType("salon");
    expect(caps.table_management).toBe(false);
    expect(caps.staff_assignment).toBe(true);
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
    expect(isBusinessType("cafe")).toBe(false);
    expect(isCapabilityKey("allergy_notes")).toBe(true);
    expect(isCapabilityKey("payments")).toBe(false);
  });
});
