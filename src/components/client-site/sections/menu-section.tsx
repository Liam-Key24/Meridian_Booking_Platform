import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function MenuSection({ payload }: ClientSiteSectionProps) {
  return (
    <ClientSiteSectionShell title="Menu">
      <p className="text-sm text-meridian-text-muted">
        Hospitality menu for {payload.business.name} will render from site
        settings when available.
      </p>
    </ClientSiteSectionShell>
  );
}
