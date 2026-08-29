import { EmptyState, ErrorState, Badge, Card } from "@/components/ui";
import { getBusinessTemplatePreview } from "@/lib/templates/registry";

type PageProps = {
  params: Promise<{ businessSlug: string }>;
};

/**
 * Safe template preview. Requires an assigned *active* template.
 * This is not a public publish surface.
 */
export default async function TemplatePreviewPage({ params }: PageProps) {
  const { businessSlug } = await params;
  let preview = null;
  let loadError: string | null = null;

  try {
    preview = await getBusinessTemplatePreview(businessSlug);
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

  if (!preview) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <EmptyState
          title="No publishable template"
          description="This business has no assigned active Meridian template matching its dashboard mode. Assign one under Admin → Settings → Template after running the latest migrations."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
      <header className="space-y-3">
        <Badge tone="soft">Template preview</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          {preview.businessName}
        </h1>
        <p className="text-meridian-text-muted">
          Previewing <strong>{preview.template.name}</strong> (
          {preview.template.slug}). Not a public publish.
        </p>
      </header>

      <Card title="Allowed sections">
        <ul className="list-disc space-y-1 pl-5 text-sm text-meridian-text">
          {preview.template.allowed_sections.map((section) => (
            <li key={section}>
              <code>{section}</code>
            </li>
          ))}
        </ul>
        {preview.template.description ? (
          <p className="mt-4 text-sm text-meridian-text-muted">
            {preview.template.description}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-meridian-text-muted">
          Branding config v{preview.branding.config_version} · primary{" "}
          <code>{preview.branding.primary_color}</code>
          {preview.branding.menu.sections.length > 0
            ? ` · ${preview.branding.menu.sections.length} menu section(s)`
            : null}
        </p>
      </Card>
    </main>
  );
}
