import { Badge } from "@/components/ui";
import { brandingCssVariables } from "@/lib/templates/branding";
import { renderClientSiteSections } from "@/lib/templates/render-sections";
import type { ClientSitePagePayload } from "@/lib/templates/payload";

type ClientSiteShellProps = {
  payload: ClientSitePagePayload;
  preview?: boolean;
  width?: "default" | "wide";
  children: React.ReactNode;
};

export function ClientSiteShell({
  payload,
  preview = false,
  width = "default",
  children,
}: ClientSiteShellProps) {
  const maxWidth =
    width === "wide" ? "max-w-6xl" : "max-w-4xl";

  return (
    <div
      className="min-h-full bg-[var(--client-background)] text-[var(--client-text)]"
      style={brandingCssVariables(payload.branding) as React.CSSProperties}
    >
      {preview ? (
        <div className="border-b border-meridian-border bg-meridian-surface px-[var(--meridian-space-page)] py-3">
          <Badge tone="soft">Template preview — not published</Badge>
        </div>
      ) : null}
      <div
        className={`mx-auto flex w-full ${maxWidth} flex-col px-[var(--meridian-space-page)] py-10`}
      >
        {children}
      </div>
    </div>
  );
}

type TemplatePendingShellProps = {
  payload: ClientSitePagePayload;
  preview?: boolean;
};

/**
 * Shared placeholder layout until mode-specific layout components ship.
 * Replace entries in TEMPLATE_LAYOUTS one commit at a time.
 */
export function TemplatePendingShell({
  payload,
  preview = true,
}: TemplatePendingShellProps) {
  return (
    <ClientSiteShell payload={payload} preview={preview}>
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-meridian-text-muted">
          Layout pending
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {payload.template.name}
        </h1>
        <p className="text-sm text-meridian-text-muted">
          Slug <code>{payload.template.slug}</code> · Mode{" "}
          {payload.template.dashboard_mode ?? payload.business.dashboard_mode}
        </p>
        {payload.template.description ? (
          <p className="text-sm text-meridian-text-muted">
            {payload.template.description}
          </p>
        ) : null}
      </header>
      <div className="mt-8 flex flex-col gap-6">
        {renderClientSiteSections(payload)}
      </div>
    </ClientSiteShell>
  );
}
