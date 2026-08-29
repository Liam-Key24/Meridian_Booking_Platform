import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function HeroSection({ payload }: ClientSiteSectionProps) {
  return (
    <ClientSiteSectionShell title="Hero">
      <h2 className="text-2xl font-semibold text-meridian-text">
        {payload.business.name}
      </h2>
      <p className="mt-2 text-sm text-meridian-text-muted">
        Hero content will use branding hero image and business copy when the
        layout ships.
      </p>
    </ClientSiteSectionShell>
  );
}
