import { Badge } from "@/components/ui";
import { brandingCssVariables } from "@/lib/templates/branding";
import type { ClientSitePagePayload } from "@/lib/templates/payload";
import { renderClientSiteSections } from "@/lib/templates/render-sections";

type ClientSiteShellProps = {
  payload: ClientSitePagePayload;
  preview?: boolean;
  children: React.ReactNode;
};

export function ClientSiteShell({
  payload,
  preview = false,
  children,
}: ClientSiteShellProps) {
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-[var(--meridian-space-page)] py-10">
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
      <div className="flex flex-col gap-6">{renderClientSiteSections(payload)}</div>
    </ClientSiteShell>
  );
}
