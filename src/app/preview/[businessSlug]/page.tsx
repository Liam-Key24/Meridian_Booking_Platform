import { EmptyState, ErrorState } from "@/components/ui";
import { renderClientSiteLayout } from "@/lib/templates/layouts";
import { getClientSitePagePayload } from "@/lib/templates/payload";

type PageProps = {
  params: Promise<{ businessSlug: string }>;
};

/**
 * Safe template preview. Requires an assigned *active* template.
 * This is not a public publish surface.
 */
export default async function TemplatePreviewPage({ params }: PageProps) {
  const { businessSlug } = await params;
  let payload = null;
  let loadError: string | null = null;

  try {
    payload = await getClientSitePagePayload(businessSlug);
  } catch (error) {
    console.error("[preview]", error);
    loadError = "Preview is temporarily unavailable.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <ErrorState title="Unable to load preview" description={loadError} />
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <EmptyState
          title="No publishable template"
          description="This business has no assigned active Meridian template matching its dashboard mode. Assign Hospitality Classic under Admin → Settings → Template."
        />
      </main>
    );
  }

  const rendered = renderClientSiteLayout(payload, { preview: true });
  if (!rendered) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <EmptyState
          title="Unknown template layout"
          description={`No layout is registered for slug "${payload.template.slug}".`}
        />
      </main>
    );
  }

  return rendered;
}
