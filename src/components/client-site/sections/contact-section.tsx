import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function ContactSection({ payload }: ClientSiteSectionProps) {
  return (
    <ClientSiteSectionShell title="Contact">
      <p className="text-sm text-meridian-text-muted">
        Contact details for {payload.business.name} will render in the final
        layout.
      </p>
    </ClientSiteSectionShell>
  );
}
