import { Card } from "@/components/ui";
import {
  ClassicSection,
  ClientSiteSectionShell,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function ContactSection({
  payload,
  variant = "stub",
  sectionId = "contact",
}: ClientSiteSectionProps) {
  const email = payload.booking.settings.notification_email;

  if (variant === "classic") {
    return (
      <ClassicSection id={sectionId} eyebrow="Visit" title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <Card padding="lg" className="border-[color-mix(in_srgb,var(--client-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--client-primary)_6%,var(--client-background))]">
            <h3 className="text-base font-semibold text-[var(--client-text)]">
              Enquiries
            </h3>
            <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--client-text)_68%,transparent)]">
              For reservations and questions, reach the team directly.
            </p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-4 inline-flex text-sm font-semibold text-[var(--client-primary)] hover:underline"
              >
                {email}
              </a>
            ) : (
              <p className="mt-4 text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
                Contact email not configured yet.
              </p>
            )}
          </Card>
          <Card padding="lg" className="border-[color-mix(in_srgb,var(--client-text)_10%,transparent)]">
            <h3 className="text-base font-semibold text-[var(--client-text)]">
              Book online
            </h3>
            <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--client-text)_68%,transparent)]">
              Prefer to reserve now? Use the booking form above.
            </p>
            <a
              href="#book"
              className="mt-4 inline-flex text-sm font-semibold text-[var(--client-primary)] hover:underline"
            >
              Go to booking
            </a>
          </Card>
        </div>
      </ClassicSection>
    );
  }

  return (
    <ClientSiteSectionShell title="Contact">
      <p className="text-sm text-meridian-text-muted">
        Contact details for {payload.business.name} will render in the final
        layout.
      </p>
    </ClientSiteSectionShell>
  );
}
