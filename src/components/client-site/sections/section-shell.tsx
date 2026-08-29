import type { ClientSitePagePayload } from "@/lib/templates/payload";

export type ClientSiteSectionVariant = "stub" | "classic";

export type ClientSiteSectionProps = {
  payload: ClientSitePagePayload;
  variant?: ClientSiteSectionVariant;
  sectionId?: string;
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

export function ClassicSection({
  id,
  title,
  eyebrow,
  children,
  className,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mb-8 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--client-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--client-text)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
