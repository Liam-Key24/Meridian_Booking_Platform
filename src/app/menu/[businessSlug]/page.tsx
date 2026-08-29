import { EmptyState, ErrorState } from "@/components/ui";
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

  const { business, branding } = payload;
  const visibleSections = branding.menu.sections.filter(
    (section) => section.visible && section.items.length > 0,
  );

  return (
    <div
      className="min-h-full bg-[var(--client-background)] font-sans text-[var(--client-text)]"
      style={brandingCssVariables(branding) as React.CSSProperties}
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
            href={`/preview/${business.slug}#book`}
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
          <h1 className="font-serif text-4xl tracking-tight">Our Menu</h1>
        </div>

        {visibleSections.length === 0 ? (
          <EmptyState
            title="Menu coming soon"
            description="Menu sections will appear here once configured in Admin → Settings → Menus."
          />
        ) : (
          <div className="space-y-12">
            {visibleSections.map((section) => (
              <section key={section.id} className="space-y-5">
                <h2 className="font-serif text-2xl tracking-tight">
                  {section.title}
                </h2>
                <ul className="divide-y divide-[color-mix(in_srgb,var(--client-text)_10%,transparent)]">
                  {section.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description ? (
                          <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_68%,transparent)]">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      {item.price ? (
                        <p className="shrink-0 text-sm font-semibold text-[var(--client-primary)]">
                          {item.price}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
