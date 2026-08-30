import type { BusinessMenu, MenuPdfDocument } from "@/lib/admin/site-settings";
import {
  DEFAULT_BRAND_COLORS,
  fontFormatFromPath,
  parseBusinessMenu,
  parseMenuPdfs,
  publicAssetUrl,
} from "@/lib/admin/site-settings";
import { templateBrandingPresetForSlug } from "@/lib/templates/catalog";
import {
  parseSiteSectionCopy,
  type SiteSectionCopy,
} from "@/lib/templates/section-copy";
import type { Json, Tables } from "@/types/database";

export type ClientSiteMenuPdf = MenuPdfDocument & {
  url: string;
};

export type ClientSiteBranding = {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  heading_font_url: string | null;
  body_font_url: string | null;
  gallery_urls: string[];
  menu: BusinessMenu;
  menu_pdfs: ClientSiteMenuPdf[];
  copy: SiteSectionCopy;
  config_version: number;
};

type SiteSettingsRow = Pick<
  Tables<"client_site_settings">,
  | "primary_color"
  | "accent_color"
  | "background_color"
  | "text_color"
  | "logo_path"
  | "favicon_path"
  | "hero_image_path"
  | "heading_font_path"
  | "body_font_path"
  | "gallery_paths"
  | "menu_json"
  | "menu_pdfs_json"
  | "template_config_version"
> & {
  section_copy_json?: Json | null;
};

export function defaultClientSiteBranding(): ClientSiteBranding {
  return {
    primary_color: DEFAULT_BRAND_COLORS.primary_color,
    accent_color: DEFAULT_BRAND_COLORS.accent_color,
    background_color: DEFAULT_BRAND_COLORS.background_color,
    text_color: DEFAULT_BRAND_COLORS.text_color,
    logo_url: null,
    favicon_url: null,
    hero_image_url: null,
    heading_font_url: null,
    body_font_url: null,
    gallery_urls: [],
    menu: { sections: [] },
    menu_pdfs: [],
    copy: parseSiteSectionCopy(null),
    config_version: 0,
  };
}

export function brandingFromSiteSettings(
  row: SiteSettingsRow | null | undefined,
): ClientSiteBranding {
  if (!row) return defaultClientSiteBranding();

  return {
    primary_color: row.primary_color,
    accent_color: row.accent_color,
    background_color: row.background_color,
    text_color: row.text_color,
    logo_url: publicAssetUrl(row.logo_path),
    favicon_url: publicAssetUrl(row.favicon_path),
    hero_image_url: publicAssetUrl(row.hero_image_path),
    heading_font_url: publicAssetUrl(row.heading_font_path),
    body_font_url: publicAssetUrl(row.body_font_path),
    gallery_urls: (row.gallery_paths ?? [])
      .map((path) => publicAssetUrl(path))
      .filter((url): url is string => Boolean(url)),
    menu: parseBusinessMenu(row.menu_json),
    menu_pdfs: parseMenuPdfs(row.menu_pdfs_json).documents
      .filter((doc) => doc.visible)
      .map((doc) => {
        const url = publicAssetUrl(doc.path);
        return url ? { ...doc, url } : null;
      })
      .filter((doc): doc is ClientSiteMenuPdf => doc !== null),
    copy: parseSiteSectionCopy(row.section_copy_json),
    config_version: row.template_config_version,
  };
}

export function brandingCssVariables(
  branding: ClientSiteBranding,
  templateSlug?: string,
): Record<string, string> {
  const fonts = templateSlug
    ? templateBrandingPresetForSlug(templateSlug)
    : null;
  const headingFallback = fonts?.headingFont ?? "Georgia, serif";
  const bodyFallback = fonts?.bodyFont ?? "system-ui, sans-serif";

  return {
    "--client-primary": branding.primary_color,
    "--client-accent": branding.accent_color,
    "--client-background": branding.background_color,
    "--client-text": branding.text_color,
    "--client-font-heading": branding.heading_font_url
      ? `"ClientHeading", ${headingFallback}`
      : headingFallback,
    "--client-font-body": branding.body_font_url
      ? `"ClientBody", ${bodyFallback}`
      : bodyFallback,
  };
}

export function brandingFontFaceCss(branding: ClientSiteBranding): string {
  const faces: string[] = [];
  if (branding.heading_font_url) {
    faces.push(
      `@font-face{font-family:"ClientHeading";src:url("${branding.heading_font_url}") format("${fontFormatFromPath(branding.heading_font_url)}");font-display:swap;}`,
    );
  }
  if (branding.body_font_url) {
    faces.push(
      `@font-face{font-family:"ClientBody";src:url("${branding.body_font_url}") format("${fontFormatFromPath(branding.body_font_url)}");font-display:swap;}`,
    );
  }
  return faces.join("");
}
