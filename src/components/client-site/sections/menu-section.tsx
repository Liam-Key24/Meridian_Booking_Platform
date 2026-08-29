import { EmptyState } from "@/components/ui";
import {
  ClassicSection,
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function MenuSection({
  payload,
  variant = "stub",
  sectionId = "menu",
}: ClientSiteSectionProps) {
  const visibleSections = payload.branding.menu.sections.filter(
    (section) => section.visible && section.items.length > 0,
  );

  if (variant === "classic") {
    return (
      <ClassicSection id={sectionId} eyebrow="Dining" title="Our menu">
        {visibleSections.length === 0 ? (
          <EmptyState
            title="Menu coming soon"
            description="Menu sections will appear here once configured in admin branding settings."
          />
        ) : (
          <div className="space-y-10">
            {visibleSections.map((section) => (
              <div key={section.id} className="space-y-4">
                <h3 className="text-xl font-semibold text-[var(--client-text)]">
                  {section.title}
                </h3>
                <ul className="divide-y divide-[color-mix(in_srgb,var(--client-text)_12%,transparent)]">
                  {section.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--client-text)]">
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_68%,transparent)]">
                            {item.description}
                          </p>
                        ) : null}
                        {item.dietary.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.dietary.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[color-mix(in_srgb,var(--client-accent)_18%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--client-accent)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {item.price ? (
                        <p className="shrink-0 text-sm font-semibold text-[var(--client-primary)]">
                          {item.price}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ClassicSection>
    );
  }

  return (
    <ClientSiteSectionShell title="Menu">
      <p className="text-sm text-meridian-text-muted">
        Hospitality menu for {payload.business.name} will render from site
        settings when available.
      </p>
    </ClientSiteSectionShell>
  );
}
