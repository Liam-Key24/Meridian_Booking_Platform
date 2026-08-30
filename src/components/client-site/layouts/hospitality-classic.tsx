import { ClientSiteTheme } from "@/components/client-site/client-site-theme";
import { HospitalityBookingSection } from "@/components/client-site/hospitality-booking-section";
import { hasTemplateSection } from "@/lib/templates/catalog";
import type { ClientSiteLayoutProps } from "@/lib/templates/layouts";

const PLACEHOLDER_GALLERY = [
  "Atmosphere",
  "Plating",
  "Interior",
  "Ingredients",
  "Dining room",
  "Wine",
];

const TESTIMONIALS = [
  {
    quote:
      "An unforgettable evening. Every course felt intentional and the service was impeccable.",
    name: "Sarah L.",
  },
  {
    quote:
      "The seasonal menu exceeded our expectations. We will be returning soon.",
    name: "James & Olivia",
  },
  {
    quote:
      "Warm, elegant, and delicious. A true gem for special occasions.",
    name: "Michael R.",
  },
];

function ClassicButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-[var(--client-accent)] text-[var(--client-background)] hover:opacity-90"
      : "border border-[color-mix(in_srgb,var(--client-accent)_35%,transparent)] text-[var(--client-text)] hover:bg-[color-mix(in_srgb,var(--client-accent)_8%,transparent)]";

  return (
    <a
      href={href}
      className={`${base} ${styles}`}
      style={
        variant === "primary"
          ? {
              backgroundColor: "var(--client-accent)",
              color: "var(--client-background)",
            }
          : undefined
      }
    >
      {children}
    </a>
  );
}

function SiteHeader({
  businessName,
  logoUrl,
  menuHref,
  showMenu,
  showGallery,
  showBooking,
  showContact,
  showHero,
}: {
  businessName: string;
  logoUrl: string | null;
  menuHref: string;
  showMenu: boolean;
  showGallery: boolean;
  showBooking: boolean;
  showContact: boolean;
  showHero: boolean;
}) {
  const links = [
    { href: "#about", label: "About", show: showHero },
    { href: menuHref, label: "Menu", show: showMenu },
    { href: "#gallery", label: "Gallery", show: showGallery },
    { href: "#book", label: "Reservations", show: showBooking },
    { href: "#contact", label: "Contact", show: showContact },
  ].filter((link) => link.show);

  return (
    <header className="border-b border-[color-mix(in_srgb,var(--client-text)_8%,transparent)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-[var(--meridian-space-page)] py-5">
        <a href="#top" className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-auto object-contain"
            />
          ) : null}
          <span className="font-serif text-xl tracking-tight text-[var(--client-text)]">
            {businessName}
          </span>
        </a>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[color-mix(in_srgb,var(--client-text)_72%,transparent)]">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="transition hover:text-[var(--client-text)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function GalleryTile({
  label,
  imageUrl,
  className,
}: {
  label: string;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--client-primary)_10%,var(--client-background))] ${className ?? ""}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[180px] items-end p-5">
          <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_55%,transparent)]">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}

export function HospitalityClassicLayout({
  payload,
  preview = false,
}: ClientSiteLayoutProps) {
  const { business, branding, booking, template } = payload;
  const menuHref = `/menu/${business.slug}`;
  const heroImage = branding.hero_image_url;
  const gallery = branding.gallery_urls;
  const sections = template.allowed_sections;
  const showHero = hasTemplateSection(sections, "hero");
  const showMenu = hasTemplateSection(sections, "menu");
  const showGallery = hasTemplateSection(sections, "gallery");
  const showBooking = hasTemplateSection(sections, "booking_widget");
  const showContact = hasTemplateSection(sections, "contact");
  const heroCopy =
    template.description ??
    "Experience culinary excellence in an intimate setting, where every dish tells a story of locally-sourced ingredients and masterful technique.";

  return (
    <ClientSiteTheme branding={branding} templateSlug={template.slug}>
    <div
      id="top"
      className="min-h-full bg-[var(--client-background)] text-[var(--client-text)] [font-family:var(--client-font-body)] [&_h1]:[font-family:var(--client-font-heading)] [&_h2]:[font-family:var(--client-font-heading)] [&_blockquote]:[font-family:var(--client-font-heading)]"
    >
      {preview ? (
        <div className="border-b border-meridian-border bg-meridian-surface px-[var(--meridian-space-page)] py-2 text-center text-xs text-meridian-text-muted">
          Template preview — not published
        </div>
      ) : null}

      <SiteHeader
        businessName={business.name}
        logoUrl={branding.logo_url}
        menuHref={menuHref}
        showMenu={showMenu}
        showGallery={showGallery}
        showBooking={showBooking}
        showContact={showContact}
        showHero={showHero}
      />

      <main>
        {showHero ? (
        <>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-[var(--meridian-space-page)] py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                A New Chapter in Fine Dining.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[color-mix(in_srgb,var(--client-text)_72%,transparent)] sm:text-lg">
                {heroCopy}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {showBooking ? (
                <ClassicButton href="#book" variant="primary">
                  Reserve Your Table
                </ClassicButton>
              ) : null}
              {showMenu ? (
                <ClassicButton href={menuHref} variant="secondary">
                  View Menu
                </ClassicButton>
              ) : null}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-[color-mix(in_srgb,var(--client-primary)_12%,var(--client-background))]">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={`${business.name} dining room`}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center p-8 text-center text-sm text-[color-mix(in_srgb,var(--client-text)_55%,transparent)]">
                Upload a hero image in Admin → Settings → Content
              </div>
            )}
          </div>
        </section>

        {/* Story */}
        <section
          id="about"
          className="mx-auto grid max-w-6xl scroll-mt-8 gap-10 px-[var(--meridian-space-page)] py-16 lg:grid-cols-2 lg:items-center"
        >
          <div className="overflow-hidden rounded-3xl bg-[color-mix(in_srgb,var(--client-accent)_12%,var(--client-background))]">
            {gallery[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[0]}
                alt="Kitchen"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center p-8 text-center text-sm text-[color-mix(in_srgb,var(--client-text)_55%,transparent)]">
                Add gallery images in Admin → Settings → Content
              </div>
            )}
          </div>
          <div className="space-y-5">
            <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
              Rooted in Seasonality,
              <br />
              Driven by Passion.
            </h2>
            <p className="text-base leading-relaxed text-[color-mix(in_srgb,var(--client-text)_72%,transparent)]">
              Our culinary philosophy celebrates the rhythm of the seasons.
              Each dish is crafted with ingredients sourced from local farmers,
              fishermen, and artisans who share our commitment to quality.
            </p>
            <p className="text-base leading-relaxed text-[color-mix(in_srgb,var(--client-text)_72%,transparent)]">
              From the first course to the last, we invite you to savour an
              experience that honours tradition while embracing innovation.
            </p>
          </div>
        </section>
        </>
        ) : null}

        {showGallery ? (
        <>
        {/* Gallery */}
        <section
          id="gallery"
          className="mx-auto max-w-6xl scroll-mt-8 px-[var(--meridian-space-page)] py-16"
        >
          <div className="mb-10 space-y-3 text-center">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              Moments &amp; Details
            </h2>
            <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
              A glimpse into the atmosphere and artistry that defines{" "}
              {business.name}.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-12">
            <GalleryTile
              label={PLACEHOLDER_GALLERY[0]}
              imageUrl={gallery[0]}
              className="md:col-span-7 md:min-h-[260px]"
            />
            <GalleryTile
              label={PLACEHOLDER_GALLERY[1]}
              imageUrl={gallery[1]}
              className="md:col-span-5 md:min-h-[260px]"
            />
            <GalleryTile
              label={PLACEHOLDER_GALLERY[2]}
              imageUrl={gallery[2]}
              className="md:col-span-3 md:min-h-[220px]"
            />
            <GalleryTile
              label={PLACEHOLDER_GALLERY[3]}
              imageUrl={gallery[3]}
              className="md:col-span-3 md:min-h-[220px]"
            />
            <GalleryTile
              label={PLACEHOLDER_GALLERY[4]}
              imageUrl={gallery[4]}
              className="md:col-span-3 md:min-h-[220px]"
            />
            <GalleryTile
              label={PLACEHOLDER_GALLERY[5]}
              imageUrl={gallery[5]}
              className="md:col-span-3 md:min-h-[220px]"
            />
            <GalleryTile
              label="Signature dish"
              imageUrl={gallery[6]}
              className="md:col-span-7 md:min-h-[240px]"
            />
            <GalleryTile
              label="Wine selection"
              imageUrl={gallery[7]}
              className="md:col-span-5 md:min-h-[240px]"
            />
          </div>
        </section>
        </>
        ) : null}

        {showBooking ? (
          <HospitalityBookingSection
            businessName={business.name}
            businessSlug={business.slug}
            booking={booking}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        ) : null}

        {showHero ? (
        <section className="bg-[color-mix(in_srgb,var(--client-text)_4%,var(--client-background))] py-16">
          <div className="mx-auto max-w-6xl px-[var(--meridian-space-page)]">
            <h2 className="mb-10 text-center font-serif text-3xl tracking-tight sm:text-4xl">
              Guest Experiences
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <figure
                  key={item.name}
                  className="rounded-2xl bg-[var(--client-background)] p-6 shadow-[0_8px_30px_color-mix(in_srgb,var(--client-text)_6%,transparent)]"
                >
                  <blockquote className="text-sm leading-relaxed text-[color-mix(in_srgb,var(--client-text)_78%,transparent)]">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-medium text-[var(--client-text)]">
                    {item.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
        ) : null}
      </main>

      {showContact ? (
      <footer
        id="contact"
        className="scroll-mt-8 bg-[var(--client-text)] text-[var(--client-background)]"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-[var(--meridian-space-page)] py-14 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <p className="font-serif text-lg">{business.name}</p>
            <p className="text-sm text-[color-mix(in_srgb,var(--client-background)_72%,transparent)]">
              Fine dining with seasonal ingredients and warm hospitality.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">
              Explore
            </p>
            <ul className="space-y-2 text-sm text-[color-mix(in_srgb,var(--client-background)_78%,transparent)]">
              <li>
                <a href="#about" className="hover:text-[var(--client-background)]">
                  About
                </a>
              </li>
              <li>
                <a href={menuHref} className="hover:text-[var(--client-background)]">
                  Menu
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  className="hover:text-[var(--client-background)]"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a href="#book" className="hover:text-[var(--client-background)]">
                  Reservations
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">
              Contact
            </p>
            <div className="space-y-2 text-sm text-[color-mix(in_srgb,var(--client-background)_78%,transparent)]">
              {booking.settings.notification_email ? (
                <a
                  href={`mailto:${booking.settings.notification_email}`}
                  className="block hover:text-[var(--client-background)]"
                >
                  {booking.settings.notification_email}
                </a>
              ) : (
                <p className="text-[color-mix(in_srgb,var(--client-background)_55%,transparent)]">
                  Contact email not configured
                </p>
              )}
              {booking.settings.contact_phone ? (
                <a
                  href={`tel:${booking.settings.contact_phone.replace(/\s+/g, "")}`}
                  className="block hover:text-[var(--client-background)]"
                >
                  {booking.settings.contact_phone}
                </a>
              ) : null}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">
              Visit
            </p>
            <p className="text-sm text-[color-mix(in_srgb,var(--client-background)_78%,transparent)]">
              Book online or contact us directly for private events.
            </p>
          </div>
        </div>
        <div className="border-t border-[color-mix(in_srgb,var(--client-background)_12%,transparent)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-[var(--meridian-space-page)] py-5 text-xs text-[color-mix(in_srgb,var(--client-background)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {business.name}. Powered by Meridian.
            </p>
            <p>Preview template: {template.name}</p>
          </div>
        </div>
      </footer>
      ) : null}
    </div>
    </ClientSiteTheme>
  );
}
