import type { DashboardMode } from "@/lib/business/modes";
import {
  assertKnownSections,
  type ClientSiteSectionKey,
} from "@/lib/templates/sections";

export type TemplateCatalogEntry = {
  name: string;
  slug: string;
  dashboard_mode: DashboardMode;
  allowed_sections: readonly ClientSiteSectionKey[];
  description: string;
};

export const HOSPITALITY_TEMPLATE_SLUGS = [
  "hospitality-classic",
  "hospitality-minimal",
  "hospitality-editorial",
] as const;

export const APPOINTMENTS_TEMPLATE_SLUGS = [
  "appointments-classic",
  "appointments-minimal",
  "appointments-studio",
] as const;

export const CLIENT_SITE_TEMPLATE_SLUGS = [
  ...HOSPITALITY_TEMPLATE_SLUGS,
  ...APPOINTMENTS_TEMPLATE_SLUGS,
] as const;

export type ClientSiteTemplateSlug = (typeof CLIENT_SITE_TEMPLATE_SLUGS)[number];

export const CLIENT_SITE_TEMPLATE_CATALOG: Record<
  ClientSiteTemplateSlug,
  TemplateCatalogEntry
> = {
  "hospitality-classic": {
    name: "Hospitality Classic",
    slug: "hospitality-classic",
    dashboard_mode: "hospitality",
    allowed_sections: [
      "hero",
      "menu",
      "gallery",
      "booking_widget",
      "contact",
    ],
    description:
      "Full hospitality site with hero, menu, gallery, and booking.",
  },
  "hospitality-minimal": {
    name: "Hospitality Minimal",
    slug: "hospitality-minimal",
    dashboard_mode: "hospitality",
    allowed_sections: ["hero", "booking_widget"],
    description: "Booking-first hospitality landing page.",
  },
  "hospitality-editorial": {
    name: "Hospitality Editorial",
    slug: "hospitality-editorial",
    dashboard_mode: "hospitality",
    allowed_sections: [
      "hero",
      "menu",
      "contact",
      "gallery",
      "booking_widget",
    ],
    description: "Story-led hospitality layout foregrounding menu and contact.",
  },
  "appointments-classic": {
    name: "Appointments Classic",
    slug: "appointments-classic",
    dashboard_mode: "appointments",
    allowed_sections: ["hero", "services", "booking_widget", "contact"],
    description: "Standard appointments site with services and booking.",
  },
  "appointments-minimal": {
    name: "Appointments Minimal",
    slug: "appointments-minimal",
    dashboard_mode: "appointments",
    allowed_sections: ["hero", "booking_widget"],
    description: "Fast appointments booking landing page.",
  },
  "appointments-studio": {
    name: "Appointments Studio",
    slug: "appointments-studio",
    dashboard_mode: "appointments",
    allowed_sections: ["hero", "services", "staff", "booking_widget"],
    description: "Staff-forward studio layout with services and booking.",
  },
};

for (const entry of Object.values(CLIENT_SITE_TEMPLATE_CATALOG)) {
  assertKnownSections(entry.allowed_sections);
}

export function isClientSiteTemplateSlug(
  value: string,
): value is ClientSiteTemplateSlug {
  return (CLIENT_SITE_TEMPLATE_SLUGS as readonly string[]).includes(value);
}

export function catalogEntryForSlug(
  slug: string,
): TemplateCatalogEntry | null {
  if (!isClientSiteTemplateSlug(slug)) return null;
  return CLIENT_SITE_TEMPLATE_CATALOG[slug];
}

export function catalogEntriesForMode(
  mode: DashboardMode,
): TemplateCatalogEntry[] {
  return Object.values(CLIENT_SITE_TEMPLATE_CATALOG).filter(
    (entry) => entry.dashboard_mode === mode,
  );
}
