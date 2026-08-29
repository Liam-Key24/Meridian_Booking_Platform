import {
  ClassicSection,
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function HeroSection({
  payload,
  variant = "stub",
  sectionId = "top",
}: ClientSiteSectionProps) {
  if (variant === "classic") {
    const { branding, business } = payload;
    const heroStyle = branding.hero_image_url
      ? {
          backgroundImage: `linear-gradient(to top, color-mix(in srgb, var(--client-text) 72%, transparent), transparent), url(${branding.hero_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          backgroundImage: `linear-gradient(135deg, var(--client-primary), var(--client-accent))`,
        };

    return (
      <section
        id={sectionId}
        className="relative -mx-[var(--meridian-space-page)] overflow-hidden rounded-[var(--meridian-radius)] px-[var(--meridian-space-page)] py-20 sm:py-28"
        style={heroStyle as React.CSSProperties}
      >
        <div className="relative mx-auto flex max-w-3xl flex-col gap-6 text-[var(--client-background)]">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt={`${business.name} logo`}
              className="h-12 w-auto object-contain"
            />
          ) : null}
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/80">
              Welcome
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {business.name}
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              {payload.template.description ??
                "Reserve your table and explore our menu."}
            </p>
          </div>
          <div>
            <a
              href="#book"
              className="inline-flex h-11 items-center justify-center rounded-[var(--meridian-radius-sm)] bg-[var(--client-background)] px-6 text-sm font-semibold text-[var(--client-primary)] transition hover:opacity-90"
            >
              Book a table
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ClientSiteSectionShell title="Hero">
      <h2 className="text-2xl font-semibold text-meridian-text">
        {payload.business.name}
      </h2>
      <p className="mt-2 text-sm text-meridian-text-muted">
        Hero content will use branding hero image and business copy when the
        layout ships.
      </p>
    </ClientSiteSectionShell>
  );
}
