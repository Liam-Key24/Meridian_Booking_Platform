import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function StaffSection({ payload }: ClientSiteSectionProps) {
  return (
    <ClientSiteSectionShell title="Staff">
      <p className="text-sm text-meridian-text-muted">
        Staff profiles for {payload.business.name} will render in the studio
        layout.
      </p>
    </ClientSiteSectionShell>
  );
}
