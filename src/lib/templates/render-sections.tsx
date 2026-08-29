import type { ComponentType } from "react";
import { BookingWidgetSection } from "@/components/client-site/sections/booking-widget-section";
import { ContactSection } from "@/components/client-site/sections/contact-section";
import { GallerySection } from "@/components/client-site/sections/gallery-section";
import { HeroSection } from "@/components/client-site/sections/hero-section";
import { MenuSection } from "@/components/client-site/sections/menu-section";
import { ServicesSection } from "@/components/client-site/sections/services-section";
import type { ClientSiteSectionProps } from "@/components/client-site/sections/section-shell";
import { StaffSection } from "@/components/client-site/sections/staff-section";
import {
  CLIENT_SITE_SECTIONS,
  type ClientSiteSectionKey,
} from "@/lib/templates/sections";
import type { ClientSitePagePayload } from "@/lib/templates/payload";

export const SECTION_COMPONENTS: Record<
  ClientSiteSectionKey,
  ComponentType<ClientSiteSectionProps>
> = {
  hero: HeroSection,
  menu: MenuSection,
  gallery: GallerySection,
  services: ServicesSection,
  staff: StaffSection,
  booking_widget: BookingWidgetSection,
  contact: ContactSection,
};

export function renderClientSiteSections(payload: ClientSitePagePayload) {
  const allowed = payload.template.allowed_sections.filter(
    (key): key is ClientSiteSectionKey =>
      (CLIENT_SITE_SECTIONS as readonly string[]).includes(key),
  );

  return allowed.map((key) => {
    const Section = SECTION_COMPONENTS[key];
    return <Section key={key} payload={payload} />;
  });
}
