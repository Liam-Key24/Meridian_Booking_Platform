/**
 * Controlled section keys for client-site templates.
 * DB `allowed_sections` must use these strings; renderer maps them to components.
 */

export const CLIENT_SITE_SECTIONS = [
  "hero",
  "menu",
  "gallery",
  "services",
  "staff",
  "booking_widget",
  "contact",
] as const;

export type ClientSiteSectionKey = (typeof CLIENT_SITE_SECTIONS)[number];

export const CLIENT_SITE_SECTION_LABELS: Record<ClientSiteSectionKey, string> =
  {
    hero: "Hero",
    menu: "Menu",
    gallery: "Gallery",
    services: "Services",
    staff: "Staff",
    booking_widget: "Booking widget",
    contact: "Contact",
  };

export function isClientSiteSectionKey(
  value: string,
): value is ClientSiteSectionKey {
  return (CLIENT_SITE_SECTIONS as readonly string[]).includes(value);
}

export function parseClientSiteSections(values: string[]): ClientSiteSectionKey[] {
  return values.filter(isClientSiteSectionKey);
}

export function assertKnownSections(
  sections: readonly ClientSiteSectionKey[],
): void {
  for (const section of sections) {
    if (!isClientSiteSectionKey(section)) {
      throw new Error(`Unknown client-site section: ${section}`);
    }
  }
}
