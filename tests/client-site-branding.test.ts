import { describe, expect, it } from "vitest";
import {
  brandingCssVariables,
  brandingFontFaceCss,
  brandingFromSiteSettings,
  defaultClientSiteBranding,
} from "@/lib/templates/branding";
import {
  DEFAULT_SITE_COPY,
  mergeSectionCopyFromFormData,
  parseSiteSectionCopy,
  resolveSiteSectionCopy,
} from "@/lib/templates/section-copy";

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
      favicon_path: "biz/favicon.ico",
      hero_image_path: null,
      heading_font_path: "biz/heading.woff2",
      body_font_path: null,
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
    expect(branding.favicon_url).toContain("biz/favicon.ico");
    expect(branding.heading_font_url).toContain("biz/heading.woff2");
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

  it("uses uploaded fonts ahead of the template preset", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const branding = brandingFromSiteSettings({
      primary_color: "#112233",
      accent_color: "#445566",
      background_color: "#FFFFFF",
      text_color: "#000000",
      logo_path: null,
      favicon_path: null,
      hero_image_path: null,
      heading_font_path: "biz/display.woff2",
      body_font_path: "biz/text.ttf",
      gallery_paths: [],
      menu_json: { sections: [] },
      menu_pdfs_json: { documents: [] },
      template_config_version: 1,
    });
    const vars = brandingCssVariables(branding, "hospitality-classic");
    expect(vars["--client-font-heading"]).toContain("ClientHeading");
    expect(vars["--client-font-body"]).toContain("ClientBody");
    expect(brandingFontFaceCss(branding)).toContain("display.woff2");
    expect(brandingFontFaceCss(branding)).toContain("truetype");

    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });

  it("uses saved site settings colours on preview", () => {
    const branding = brandingFromSiteSettings({
      primary_color: "#112233",
      accent_color: "#445566",
      background_color: "#FFFFFF",
      text_color: "#000000",
      logo_path: null,
      favicon_path: null,
      hero_image_path: null,
      heading_font_path: null,
      body_font_path: null,
      gallery_paths: [],
      menu_json: { sections: [] },
      menu_pdfs_json: { documents: [] },
      template_config_version: 2,
    });

    expect(branding.primary_color).toBe("#112233");
    expect(branding.accent_color).toBe("#445566");
  });
});

describe("site section copy", () => {
  it("resolves saved hero copy ahead of template fallbacks", () => {
    const saved = parseSiteSectionCopy({
      hero_heading: "Custom heading",
      hero_body: "Custom intro",
    });
    const copy = resolveSiteSectionCopy(saved, {
      hero_body: "Template description",
    });
    expect(copy.hero_heading).toBe("Custom heading");
    expect(copy.hero_body).toBe("Custom intro");
    expect(copy.gallery_heading).toBe(DEFAULT_SITE_COPY.gallery_heading);
  });

  it("keeps hidden-section copy when those fields are not in the form", () => {
    const current = resolveSiteSectionCopy(
      parseSiteSectionCopy({ hero_heading: "Keep this" }),
    );
    const formData = new FormData();
    formData.set("contactTagline", "New footer line");
    const merged = mergeSectionCopyFromFormData(formData, current);
    expect(merged.hero_heading).toBe("Keep this");
    expect(merged.contact_tagline).toBe("New footer line");
  });
});
