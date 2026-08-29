import type { ClientSitePagePayload } from "@/lib/templates/payload";

export type ClientSiteSectionProps = {
  payload: ClientSitePagePayload;
};

export function ClientSiteSectionShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[var(--meridian-radius-lg)] border border-dashed border-meridian-border bg-meridian-surface/40 p-6"
      data-section={title.toLowerCase().replace(/\s+/g, "-")}
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-meridian-text-muted">
        Section stub — {title}
      </p>
      {children}
    </section>
  );
}
