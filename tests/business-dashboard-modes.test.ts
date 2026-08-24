import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  CAPABILITY_KEYS,
  capabilityMapFromKeys,
  defaultCapabilitiesForMode,
  getDashboardModeForBusinessType,
  hasCapability,
  isBusinessType,
  resolveDashboardMode,
} from "@/lib/business/modes";

describe("dashboard mode mapping", () => {
  it("maps appointment verticals to appointments mode", () => {
    for (const type of [
      "barber",
      "hairdresser",
      "beauty_salon",
      "tattoo_studio",
      "nail_salon",
      "tanning_studio",
    ] as const) {
      expect(getDashboardModeForBusinessType(type)).toBe("appointments");
    }
  });

  it("maps hospitality verticals and other to hospitality mode", () => {
    expect(getDashboardModeForBusinessType("restaurant")).toBe("hospitality");
    expect(getDashboardModeForBusinessType("cafe")).toBe("hospitality");
    expect(getDashboardModeForBusinessType("pub")).toBe("hospitality");
    expect(getDashboardModeForBusinessType("other")).toBe("hospitality");
  });

  it("defaults unresolved mode to hospitality so existing tenants stay stable", () => {
    expect(resolveDashboardMode({})).toBe("hospitality");
    expect(resolveDashboardMode({ dashboard_mode: null })).toBe("hospitality");
    expect(resolveDashboardMode({ business_type: "barber" })).toBe(
      "appointments",
    );
    expect(
      resolveDashboardMode({
        business_type: "barber",
        dashboard_mode: "hospitality",
      }),
    ).toBe("hospitality");
  });

  it("exposes the full business type and capability allowlists", () => {
    expect(BUSINESS_TYPES).toContain("beauty_salon");
    expect(BUSINESS_TYPES).toContain("restaurant");
    expect(isBusinessType("tattoo_studio")).toBe(true);
    expect(isBusinessType("salon")).toBe(false);
    expect(CAPABILITY_KEYS).toContain("tables");
    expect(CAPABILITY_KEYS).toContain("staff");
    expect(CAPABILITY_KEYS).toContain("allergies");
  });
});

describe("default capability packs", () => {
  it("enables hospitality defaults including tables and kitchen/bar", () => {
    const caps = capabilityMapFromKeys(
      defaultCapabilitiesForMode("hospitality"),
    );
    expect(hasCapability(caps, "tables")).toBe(true);
    expect(hasCapability(caps, "party_size")).toBe(true);
    expect(hasCapability(caps, "allergies")).toBe(true);
    expect(hasCapability(caps, "kitchen_hours")).toBe(true);
    expect(hasCapability(caps, "bar_hours")).toBe(true);
    expect(hasCapability(caps, "staff")).toBe(false);
    expect(hasCapability(caps, "availability")).toBe(false);
  });

  it("enables appointments defaults including staff and services", () => {
    const caps = capabilityMapFromKeys(
      defaultCapabilitiesForMode("appointments"),
    );
    expect(hasCapability(caps, "services")).toBe(true);
    expect(hasCapability(caps, "staff")).toBe(true);
    expect(hasCapability(caps, "availability")).toBe(true);
    expect(hasCapability(caps, "external_booking_link")).toBe(true);
    expect(hasCapability(caps, "email_notifications")).toBe(true);
    expect(hasCapability(caps, "tables")).toBe(false);
    expect(hasCapability(caps, "allergies")).toBe(false);
    expect(hasCapability(caps, "kitchen_hours")).toBe(false);
  });
});
