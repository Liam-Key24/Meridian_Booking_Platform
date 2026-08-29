import { ClientSiteShell } from "@/components/client-site/template-pending-shell";
import { BookingWidgetSection } from "@/components/client-site/sections/booking-widget-section";
import { ContactSection } from "@/components/client-site/sections/contact-section";
import { GallerySection } from "@/components/client-site/sections/gallery-section";
import { HeroSection } from "@/components/client-site/sections/hero-section";
import { MenuSection } from "@/components/client-site/sections/menu-section";
import type { ClientSitePagePayload } from "@/lib/templates/payload";
import type { ClientSiteSectionKey } from "@/lib/templates/sections";

const CLASSIC_SECTIONS: Partial<
  Record<
    ClientSiteSectionKey,
    React.ComponentType<{
      payload: ClientSitePagePayload;
      variant: "classic";
      sectionId?: string;
    }>
  >
> = {
  hero: HeroSection,
  menu: MenuSection,
  gallery: GallerySection,
  booking_widget: BookingWidgetSection,
  contact: ContactSection,
};

const NAV_LABELS: Partial<Record<ClientSiteSectionKey, string>> = {
  menu: "Menu",
  gallery: "Gallery",
  booking_widget: "Book",
  contact: "Contact",
};

const SECTION_IDS: Partial<Record<ClientSiteSectionKey, string>> = {
  hero: "top",
  menu: "menu",
  gallery: "gallery",
  booking_widget: "book",
  contact: "contact",
};

export function HospitalityClassicLayout({
  payload,
  preview = true,
}: {
  payload: ClientSitePagePayload;
  preview?: boolean;
}) {
  const allowed = payload.template.allowed_sections.filter(
    (key): key is ClientSiteSectionKey => key in CLASSIC_SECTIONS,
  );

  const navItems = allowed
    .filter((key) => key !== "hero" && NAV_LABELS[key])
    .map((key) => ({
      key,
      href: `#${SECTION_IDS[key] ?? key}`,
      label: NAV_LABELS[key]!,
    }));

  return (
    <ClientSiteShell payload={payload} preview={preview} width="wide">
      <header className="mb-10 flex flex-col gap-6 border-b border-[color-mix(in_srgb,var(--client-text)_10%,transparent)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--client-accent)]">
            Hospitality Classic
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--client-text)]">
            {payload.business.name}
          </p>
        </div>
        {navItems.length > 0 ? (
          <nav aria-label="Page sections">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[color-mix(in_srgb,var(--client-text)_72%,transparent)]">
              {navItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="transition hover:text-[var(--client-primary)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="flex flex-col gap-16 pb-8">
        {allowed.map((key) => {
          const Section = CLASSIC_SECTIONS[key];
          if (!Section) return null;
          return (
            <Section
              key={key}
              payload={payload}
              variant="classic"
              sectionId={SECTION_IDS[key]}
            />
          );
        })}
      </main>

      <footer className="border-t border-[color-mix(in_srgb,var(--client-text)_10%,transparent)] pt-8 text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
        <p>
          © {new Date().getFullYear()} {payload.business.name}. Powered by
          Meridian.
        </p>
      </footer>
    </ClientSiteShell>
  );
}
