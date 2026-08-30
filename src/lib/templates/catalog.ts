import type { DashboardMode } from "@/lib/business/modes";
import { DEFAULT_BRAND_COLORS } from "@/lib/admin/site-settings";
import { AVAILABLE_TEMPLATE_LAYOUT_SLUGS } from "@/lib/templates/layouts";

export type TemplateSectionKey =
  | "hero"
  | "menu"
  | "gallery"
  | "booking_widget"
  | "contact"
  | "services"
  | "staff";

export const TEMPLATE_SECTION_LABELS: Record<TemplateSectionKey, string> = {
  hero: "Hero",
  menu: "Menu",
  gallery: "Gallery",
  booking_widget: "Booking",
  contact: "Contact",
  services: "Services",
  staff: "Staff",
};

/** Labels for hospitality gallery tiles, in display order. */
export const GALLERY_SLOT_LABELS = [
  "Atmosphere",
  "Plating",
  "Interior",
  "Ingredients",
  "Dining room",
  "Wine",
  "Signature dish",
  "Wine selection",
] as const;

export type TemplateBrandingPreset = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  headingFontLabel: string;
  bodyFontLabel: string;
};

export type TemplateCatalogEntry = {
  slug: string;
  previewImage: string;
  branding: TemplateBrandingPreset;
};

export const TEMPLATE_CATALOG: Record<string, TemplateCatalogEntry> = {
  "hospitality-classic": {
    slug: "hospitality-classic",
    previewImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#1C1917",
      accent: "#92400E",
      background: "#FAF7F2",
      text: "#1C1917",
      headingFont: "Georgia, 'Times New Roman', serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      headingFontLabel: "Serif",
      bodyFontLabel: "Sans",
    },
  },
  "hospitality-minimal": {
    slug: "hospitality-minimal",
    previewImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#111827",
      accent: "#059669",
      background: "#FFFFFF",
      text: "#111827",
      headingFont: "system-ui, -apple-system, sans-serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      headingFontLabel: "Sans",
      bodyFontLabel: "Sans",
    },
  },
  "hospitality-editorial": {
    slug: "hospitality-editorial",
    previewImage:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#292524",
      accent: "#B45309",
      background: "#FFFBEB",
      text: "#292524",
      headingFont: "'Iowan Old Style', Georgia, serif",
      bodyFont: "Georgia, serif",
      headingFontLabel: "Editorial",
      bodyFontLabel: "Serif",
    },
  },
  "appointments-classic": {
    slug: "appointments-classic",
    previewImage:
      "https://images.unsplash.com/photo-1560066984-138d7434cd09?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#0F766E",
      accent: "#0D9488",
      background: "#FFFFFF",
      text: "#0F172A",
      headingFont: "system-ui, -apple-system, sans-serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      headingFontLabel: "Sans",
      bodyFontLabel: "Sans",
    },
  },
  "appointments-minimal": {
    slug: "appointments-minimal",
    previewImage:
      "https://images.unsplash.com/photo-1521590832167-fbc72d5cbf67?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#18181B",
      accent: "#6366F1",
      background: "#FAFAFA",
      text: "#18181B",
      headingFont: "system-ui, -apple-system, sans-serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      headingFontLabel: "Sans",
      bodyFontLabel: "Sans",
    },
  },
  "appointments-studio": {
    slug: "appointments-studio",
    previewImage:
      "https://images.unsplash.com/photo-1633681926022-84c23e8cb967?auto=format&fit=crop&w=640&q=80",
    branding: {
      primary: "#3F3F46",
      accent: "#A855F7",
      background: "#FFFFFF",
      text: "#27272A",
      headingFont: "Georgia, serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      headingFontLabel: "Serif",
      bodyFontLabel: "Sans",
    },
  },
};

export type AdminTemplateOption = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "retired";
  description: string | null;
  allowedSections: string[];
  dashboardMode: DashboardMode | null;
  previewImage: string;
  branding: TemplateBrandingPreset;
  layoutAvailable: boolean;
};

const FALLBACK_BRANDING: TemplateBrandingPreset = {
  primary: DEFAULT_BRAND_COLORS.primary_color,
  accent: DEFAULT_BRAND_COLORS.accent_color,
  background: DEFAULT_BRAND_COLORS.background_color,
  text: DEFAULT_BRAND_COLORS.text_color,
  headingFont: "Georgia, serif",
  bodyFont: "system-ui, sans-serif",
  headingFontLabel: "Serif",
  bodyFontLabel: "Sans",
};

export function catalogEntryForSlug(slug: string): TemplateCatalogEntry {
  return (
    TEMPLATE_CATALOG[slug] ?? {
      slug,
      previewImage:
        "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=640&q=80",
      branding: FALLBACK_BRANDING,
    }
  );
}

export function templateBrandingPresetForSlug(slug: string): TemplateBrandingPreset {
  return catalogEntryForSlug(slug).branding;
}

/** Map catalog preset fields to client_site_settings column names. */
export function presetToSiteSettingsColors(preset: TemplateBrandingPreset): {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
} {
  return {
    primary_color: preset.primary,
    accent_color: preset.accent,
    background_color: preset.background,
    text_color: preset.text,
  };
}

export function hasTemplateSection(
  allowedSections: string[],
  section: TemplateSectionKey,
): boolean {
  if (allowedSections.length === 0) return true;
  return allowedSections.includes(section);
}

export function siteSettingsUseDefaultColors(colors: {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}): boolean {
  return (
    colors.primary_color.toLowerCase() ===
      DEFAULT_BRAND_COLORS.primary_color.toLowerCase() &&
    colors.accent_color.toLowerCase() ===
      DEFAULT_BRAND_COLORS.accent_color.toLowerCase() &&
    colors.background_color.toLowerCase() ===
      DEFAULT_BRAND_COLORS.background_color.toLowerCase() &&
    colors.text_color.toLowerCase() === DEFAULT_BRAND_COLORS.text_color.toLowerCase()
  );
}

export function enrichTemplateForAdmin(template: {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "retired";
  description: string | null;
  allowed_sections: unknown;
  dashboard_mode: DashboardMode | null;
}): AdminTemplateOption {
  const allowedSections = parseAllowedSections(template.allowed_sections);
  const catalog = catalogEntryForSlug(template.slug);

  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    status: template.status,
    description: template.description,
    allowedSections,
    dashboardMode: template.dashboard_mode,
    previewImage: catalog.previewImage,
    branding: catalog.branding,
    layoutAvailable: AVAILABLE_TEMPLATE_LAYOUT_SLUGS.has(template.slug),
  };
}

function parseAllowedSections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
