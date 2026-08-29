import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filterBusinessSettingsNav,
  isSettingsSlugForMode,
} from "@/lib/admin/business-settings-nav";
import { parseBusinessMenu } from "@/lib/admin/site-settings";

describe("business settings nav", () => {
  it("shows hospitality hours, tables, and menus", () => {
    const groups = filterBusinessSettingsNav("hospitality");
    const slugs = groups.flatMap((g) => g.items.map((i) => i.slug));
    expect(slugs).toContain("hours");
    expect(slugs).toContain("tables");
    expect(slugs).toContain("menus");
    expect(slugs).not.toContain("services");
  });

  it("shows appointments services and hides hospitality-only pages", () => {
    const groups = filterBusinessSettingsNav("appointments");
    const slugs = groups.flatMap((g) => g.items.map((i) => i.slug));
    expect(slugs).toContain("services");
    expect(slugs).not.toContain("hours");
    expect(slugs).not.toContain("tables");
    expect(slugs).not.toContain("menus");
  });

  it("validates slug visibility per mode", () => {
    expect(isSettingsSlugForMode("menus", "hospitality")).toBe(true);
    expect(isSettingsSlugForMode("menus", "appointments")).toBe(false);
    expect(isSettingsSlugForMode("branding", "appointments")).toBe(true);
  });
});

describe("client site settings migration", () => {
  it("defines branding store, assignment sync columns, and assets bucket", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260827073737_client_site_settings_and_assets.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("create table public.client_site_settings");
    expect(sql).toContain("template_config_version");
    expect(sql).toContain("business_template_assignments");
    expect(sql).toContain("last_synced_at");
    expect(sql).toContain("business-assets");
    expect(sql).toContain("enable row level security");
  });
});

describe("parseBusinessMenu", () => {
  it("normalises menu sections and items", () => {
    const menu = parseBusinessMenu({
      sections: [
        {
          id: "s1",
          title: "Mains",
          visible: true,
          items: [{ id: "i1", name: "Fish", description: "Fresh", price: "£14" }],
        },
      ],
    });
    expect(menu.sections).toHaveLength(1);
    expect(menu.sections[0]?.title).toBe("Mains");
    expect(menu.sections[0]?.items[0]?.name).toBe("Fish");
  });
});
