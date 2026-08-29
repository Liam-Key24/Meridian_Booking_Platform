import {
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function GallerySection({ payload }: ClientSiteSectionProps) {
  const count = payload.branding.gallery_urls.length;
  return (
    <ClientSiteSectionShell title="Gallery">
      <p className="text-sm text-meridian-text-muted">
        {count > 0
          ? `${count} gallery image(s) configured.`
          : "Gallery images will appear here from site settings."}
      </p>
    </ClientSiteSectionShell>
  );
}
