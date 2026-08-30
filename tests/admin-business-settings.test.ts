import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filterBusinessSettingsNav,
  isSettingsSlugForMode,
} from "@/lib/admin/business-settings-nav";
import { parseBusinessMenu, parseMenuPdfs } from "@/lib/admin/site-settings";
import { GALLERY_SLOT_LABELS } from "@/lib/templates/catalog";

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
    expect(isSettingsSlugForMode("content", "hospitality")).toBe(true);
    expect(isSettingsSlugForMode("content", "appointments")).toBe(true);
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

  it("adds favicon and uploaded font columns", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260830100001_client_site_content_and_fonts.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("favicon_path");
    expect(sql).toContain("heading_font_path");
    expect(sql).toContain("body_font_path");
    expect(sql).toContain("font/woff2");
  });

  it("adds written section copy json", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260830084150_client_site_section_copy.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("section_copy_json");
  });
});

describe("site templates dashboard_mode migration", () => {
  it("adds mode-aware templates and retires legacy seeds", () => {
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
    expect(sql).toContain("'retired'");
  });

  it("activates hospitality-classic for assignment", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260829171001_activate_hospitality_classic.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("hospitality-classic");
    expect(sql).toContain("'active'");
  });
});

describe("gallery slot labels", () => {
  it("names each hospitality gallery tile in order", () => {
    expect(GALLERY_SLOT_LABELS).toEqual([
      "Atmosphere",
      "Plating",
      "Interior",
      "Ingredients",
      "Dining room",
      "Wine",
      "Signature dish",
      "Wine selection",
    ]);
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

describe("parseMenuPdfs", () => {
  it("normalises menu pdf documents", () => {
    const pdfs = parseMenuPdfs({
      documents: [
        {
          id: "p1",
          title: " Lunch ",
          path: "biz/menu.pdf",
          visible: true,
        },
        { id: "p2", title: "Skip", path: "", visible: true },
      ],
    });
    expect(pdfs.documents).toHaveLength(1);
    expect(pdfs.documents[0]?.title).toBe("Lunch");
    expect(pdfs.documents[0]?.path).toBe("biz/menu.pdf");
  });

  it("adds menu_pdfs_json migration for client site settings", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260829180001_client_site_menu_pdfs.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("menu_pdfs_json");
    expect(sql).toContain("application/pdf");
  });
});

describe("template settings sync", () => {
  it("syncs settings after template assignment and admin saves", () => {
    const sync = readFileSync(
      join(process.cwd(), "src/lib/templates/sync.ts"),
      "utf8",
    );
    const assign = readFileSync(
      join(process.cwd(), "src/lib/templates/actions.ts"),
      "utf8",
    );
    const adminActions = readFileSync(
      join(process.cwd(), "src/lib/admin/actions.ts"),
      "utf8",
    );
    const siteSettings = readFileSync(
      join(process.cwd(), "src/lib/admin/site-settings-actions.ts"),
      "utf8",
    );

    expect(sync).toContain("syncSettingsToTemplate");
    expect(sync).toContain("revalidatePublishedClientSitePaths");
    expect(assign).toContain("revalidatePublishedClientSitePaths");
    expect(adminActions).toContain("syncSettingsToTemplate");
    expect(siteSettings).toContain("syncSettingsToTemplate");
  });
});
