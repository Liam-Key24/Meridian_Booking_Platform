import { EmptyState, ErrorState } from "@/components/ui";
import { HospitalityBookingSection } from "@/components/client-site/hospitality-booking-section";
import { MenuPdfViewer } from "@/components/client-site/menu-pdf-viewer";
import { brandingCssVariables } from "@/lib/templates/branding";
import { getClientSitePagePayload } from "@/lib/templates/payload";

type PageProps = {
  params: Promise<{ businessSlug: string }>;
};

export default async function ClientMenuPage({ params }: PageProps) {
  const { businessSlug } = await params;
  let payload = null;
  let loadError: string | null = null;

  try {
    payload = await getClientSitePagePayload(businessSlug);
  } catch (error) {
    console.error("[menu]", error);
    loadError = "Menu is temporarily unavailable.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <ErrorState title="Unable to load menu" description={loadError} />
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <EmptyState
          title="Menu unavailable"
          description="This business has no publishable template assigned yet."
        />
      </main>
    );
  }

  const { business, branding, booking, template } = payload;

  return (
    <div
      className="min-h-full bg-[var(--client-background)] text-[var(--client-text)] [font-family:var(--client-font-body)] [&_h1]:[font-family:var(--client-font-heading)]"
      style={brandingCssVariables(branding, template.slug) as React.CSSProperties}
    >
      <header className="border-b border-[color-mix(in_srgb,var(--client-text)_8%,transparent)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-[var(--meridian-space-page)] py-5">
          <a
            href={`/preview/${business.slug}`}
            className="font-serif text-xl tracking-tight"
          >
            {business.name}
          </a>
          <a
            href="#book"
            className="text-sm text-[color-mix(in_srgb,var(--client-text)_72%,transparent)] hover:text-[var(--client-text)]"
          >
            Reserve a table
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-[var(--meridian-space-page)] py-14">
        <div className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--client-accent)]">
            Dining
          </p>
          <h1 className="font-serif text-4xl tracking-tight">Our Menus</h1>
          <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
            Select a menu to view, zoom, and read.
          </p>
        </div>

        {branding.menu_pdfs.length === 0 ? (
          <EmptyState
            title="Menus coming soon"
            description="Upload menu PDFs in Admin → Settings → Menus."
          />
        ) : (
          <MenuPdfViewer documents={branding.menu_pdfs} />
        )}
      </main>

      <HospitalityBookingSection
        businessName={business.name}
        businessSlug={business.slug}
        booking={booking}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        className="mx-auto max-w-3xl scroll-mt-8 border-t border-[color-mix(in_srgb,var(--client-text)_8%,transparent)] px-[var(--meridian-space-page)] py-16"
      />
    </div>
  );
}
