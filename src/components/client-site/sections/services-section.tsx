import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function ServicesSection({ payload }: ClientSiteSectionProps) {
  const count = payload.booking.services.length;
  return (
    <ClientSiteSectionShell title="Services">
      <p className="text-sm text-meridian-text-muted">
        {count > 0
          ? `${count} active service(s) will be styled in the layout.`
          : "No active services yet."}
      </p>
    </ClientSiteSectionShell>
  );
}
