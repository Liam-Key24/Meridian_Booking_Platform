import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPOINTMENTS_TEMPLATE_SLUGS,
  CLIENT_SITE_TEMPLATE_CATALOG,
  CLIENT_SITE_TEMPLATE_SLUGS,
  HOSPITALITY_TEMPLATE_SLUGS,
  catalogEntriesForMode,
} from "@/lib/templates/catalog";
import { TEMPLATE_LAYOUTS } from "@/lib/templates/layouts";
import {
  CLIENT_SITE_SECTIONS,
  isClientSiteSectionKey,
  parseClientSiteSections,
} from "@/lib/templates/sections";

describe("client-site template catalog", () => {
  it("defines three hospitality and three appointments templates", () => {
    expect(HOSPITALITY_TEMPLATE_SLUGS).toHaveLength(3);
    expect(APPOINTMENTS_TEMPLATE_SLUGS).toHaveLength(3);
    expect(CLIENT_SITE_TEMPLATE_SLUGS).toHaveLength(6);
  });

  it("keeps catalog sections aligned with known section keys", () => {
    for (const slug of CLIENT_SITE_TEMPLATE_SLUGS) {
      const entry = CLIENT_SITE_TEMPLATE_CATALOG[slug];
      expect(entry.slug).toBe(slug);
      for (const section of entry.allowed_sections) {
        expect(isClientSiteSectionKey(section)).toBe(true);
      }
    }
  });

  it("filters catalog entries by dashboard mode", () => {
    expect(catalogEntriesForMode("hospitality")).toHaveLength(3);
    expect(catalogEntriesForMode("appointments")).toHaveLength(3);
  });
});

describe("client-site layout registry", () => {
  it("registers a layout entry for every catalog slug", () => {
    for (const slug of CLIENT_SITE_TEMPLATE_SLUGS) {
      expect(TEMPLATE_LAYOUTS[slug]).toBeDefined();
    }
  });
});

describe("client-site sections", () => {
  it("parses allowed section keys from template rows", () => {
    expect(
      parseClientSiteSections(["hero", "booking_widget", "unknown"]),
    ).toEqual(["hero", "booking_widget"]);
  });

  it("covers booking and mode-specific sections", () => {
    expect(CLIENT_SITE_SECTIONS).toContain("booking_widget");
    expect(CLIENT_SITE_SECTIONS).toContain("menu");
    expect(CLIENT_SITE_SECTIONS).toContain("services");
    expect(CLIENT_SITE_SECTIONS).toContain("staff");
  });
});

describe("site templates dashboard_mode migration", () => {
  it("seeds six mode-specific draft templates", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260829170001_site_templates_dashboard_mode.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("dashboard_mode");
    expect(sql).toContain("hospitality-classic");
    expect(sql).toContain("appointments-studio");
    expect(sql).toContain("'draft'");
    expect(sql).toContain("meridian-classic");
    expect(sql).toContain("'retired'");
  });
});
