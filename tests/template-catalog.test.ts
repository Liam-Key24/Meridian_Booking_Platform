import { describe, expect, it } from "vitest";
import {
  catalogEntryForSlug,
  enrichTemplateForAdmin,
  hasTemplateSection,
  presetToSiteSettingsColors,
  siteSettingsUseDefaultColors,
  templateBrandingPresetForSlug,
} from "@/lib/templates/catalog";
import { DEFAULT_BRAND_COLORS } from "@/lib/admin/site-settings";

describe("template catalog", () => {
  it("returns preview metadata and branding for known templates", () => {
    const entry = catalogEntryForSlug("hospitality-classic");
    expect(entry.previewImage).toContain("unsplash.com");
    expect(entry.branding.primary).toBe("#1C1917");
    expect(entry.branding.headingFontLabel).toBe("Serif");
  });

  it("exposes branding presets by slug", () => {
    const preset = templateBrandingPresetForSlug("hospitality-minimal");
    expect(preset.accent).toBe("#059669");
    expect(preset.bodyFontLabel).toBe("Sans");
  });

  it("maps catalog preset fields to site settings columns", () => {
    const preset = templateBrandingPresetForSlug("hospitality-classic");
    expect(presetToSiteSettingsColors(preset)).toEqual({
      primary_color: "#1C1917",
      accent_color: "#92400E",
      background_color: "#FAF7F2",
      text_color: "#1C1917",
    });
  });

  it("detects Meridian default colours", () => {
    expect(siteSettingsUseDefaultColors(DEFAULT_BRAND_COLORS)).toBe(true);
    expect(
      siteSettingsUseDefaultColors({
        ...DEFAULT_BRAND_COLORS,
        accent_color: "#059669",
      }),
    ).toBe(false);
  });

  it("respects allowed section gates", () => {
    expect(hasTemplateSection(["hero", "menu"], "gallery")).toBe(false);
    expect(hasTemplateSection(["hero", "menu"], "menu")).toBe(true);
    expect(hasTemplateSection([], "menu")).toBe(true);
  });

  it("marks only registered layouts as available", () => {
    const classic = enrichTemplateForAdmin({
      id: "1",
      name: "Hospitality Classic",
      slug: "hospitality-classic",
      status: "active",
      description: "Classic layout",
      allowed_sections: ["hero", "menu"],
      dashboard_mode: "hospitality",
    });
    const minimal = enrichTemplateForAdmin({
      id: "2",
      name: "Hospitality Minimal",
      slug: "hospitality-minimal",
      status: "draft",
      description: "Minimal layout",
      allowed_sections: ["hero"],
      dashboard_mode: "hospitality",
    });

    expect(classic.layoutAvailable).toBe(true);
    expect(minimal.layoutAvailable).toBe(false);
  });
});
