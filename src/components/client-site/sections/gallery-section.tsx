import {
  ClassicSection,
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function GallerySection({
  payload,
  variant = "stub",
  sectionId = "gallery",
}: ClientSiteSectionProps) {
  const images = payload.branding.gallery_urls;

  if (variant === "classic") {
    return (
      <ClassicSection id={sectionId} eyebrow="Atmosphere" title="Gallery">
        {images.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-[var(--meridian-radius-sm)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${payload.business.name} gallery ${index + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="flex aspect-[4/3] items-end rounded-[var(--meridian-radius-sm)] bg-[color-mix(in_srgb,var(--client-primary)_12%,var(--client-background))] p-4"
              >
                <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
                  Photo {slot} — upload in admin branding
                </p>
              </div>
            ))}
          </div>
        )}
      </ClassicSection>
    );
  }

  const count = images.length;
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
