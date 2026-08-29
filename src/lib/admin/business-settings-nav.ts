/**
 * Mode-aware admin business settings nav (mini-pages).
 */

import type { DashboardMode } from "@/types/database";

export type BusinessSettingsNavItem = {
  slug: string;
  label: string;
  /** When set, only show for this mode. */
  modes?: DashboardMode[];
};

export type BusinessSettingsNavGroup = {
  label: string;
  items: BusinessSettingsNavItem[];
};

export const BUSINESS_SETTINGS_NAV: BusinessSettingsNavGroup[] = [
  {
    label: "Business",
    items: [
      { slug: "details", label: "Details" },
      { slug: "access", label: "Access" },
      { slug: "mode", label: "Mode" },
      { slug: "capabilities", label: "Capabilities" },
      { slug: "members", label: "Members" },
    ],
  },
  {
    label: "Booking",
    items: [
      { slug: "booking", label: "Booking" },
      { slug: "hours", label: "Hours", modes: ["hospitality"] },
      { slug: "tables", label: "Tables", modes: ["hospitality"] },
      { slug: "services", label: "Services", modes: ["appointments"] },
    ],
  },
  {
    label: "Site",
    items: [
      { slug: "branding", label: "Branding" },
      { slug: "menus", label: "Menus", modes: ["hospitality"] },
      { slug: "template", label: "Template" },
    ],
  },
];

export function filterBusinessSettingsNav(
  mode: DashboardMode,
): BusinessSettingsNavGroup[] {
  return BUSINESS_SETTINGS_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.modes || item.modes.includes(mode),
    ),
  })).filter((group) => group.items.length > 0);
}

export function isSettingsSlugForMode(
  slug: string,
  mode: DashboardMode,
): boolean {
  return filterBusinessSettingsNav(mode).some((group) =>
    group.items.some((item) => item.slug === slug),
  );
}

export function settingsHref(businessId: string, slug: string): string {
  return `/admin/businesses/${businessId}/settings/${slug}`;
}
