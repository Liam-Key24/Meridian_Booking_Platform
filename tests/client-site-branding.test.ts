import { describe, expect, it } from "vitest";
import {
  brandingCssVariables,
  brandingFromSiteSettings,
  defaultClientSiteBranding,
} from "@/lib/templates/branding";

describe("client site branding", () => {
  it("maps admin site settings into template branding", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const branding = brandingFromSiteSettings({
      primary_color: "#112233",
      accent_color: "#445566",
      background_color: "#FFFFFF",
      text_color: "#000000",
      logo_path: "biz/logo.png",
      hero_image_path: null,
      gallery_paths: ["biz/a.jpg", "biz/b.jpg"],
      menu_json: {
        sections: [
          {
            id: "s1",
            title: "Starters",
            visible: true,
            items: [
              {
                id: "i1",
                name: "Soup",
                description: "Daily",
                price: "£6",
                dietary: ["V"],
              },
            ],
          },
        ],
      },
      menu_pdfs_json: {
        documents: [
          {
            id: "pdf1",
            title: "Lunch",
            path: "biz/lunch.pdf",
            visible: true,
          },
          {
            id: "pdf2",
            title: "Hidden dinner",
            path: "biz/dinner.pdf",
            visible: false,
          },
        ],
      },
      template_config_version: 3,
    });

    expect(branding.primary_color).toBe("#112233");
    expect(branding.config_version).toBe(3);
    expect(branding.menu.sections).toHaveLength(1);
    expect(branding.menu_pdfs).toHaveLength(1);
    expect(branding.menu_pdfs[0]?.title).toBe("Lunch");
    expect(branding.logo_url).toContain("biz/logo.png");
    expect(branding.gallery_urls).toHaveLength(2);

    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });

  it("falls back to defaults when settings are missing", () => {
    expect(defaultClientSiteBranding().config_version).toBe(0);
    expect(brandingFromSiteSettings(null).menu.sections).toEqual([]);
    expect(brandingFromSiteSettings(null).menu_pdfs).toEqual([]);
  });

  it("maps branding and template fonts to CSS variables", () => {
    const branding = defaultClientSiteBranding();
    branding.primary_color = "#112233";

    const vars = brandingCssVariables(branding, "hospitality-classic");
    expect(vars["--client-primary"]).toBe("#112233");
    expect(vars["--client-font-heading"]).toContain("Georgia");
    expect(vars["--client-font-body"]).toContain("system-ui");
  });
});
