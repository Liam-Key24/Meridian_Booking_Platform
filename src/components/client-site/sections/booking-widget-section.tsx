import { BookingWidget } from "@/components/booking/booking-widget";
import {
  ClassicSection,
  type ClientSiteSectionProps,
} from "@/components/client-site/sections/section-shell";

export function BookingWidgetSection({
  payload,
  variant = "stub",
  sectionId = "book",
}: ClientSiteSectionProps) {
  const { booking, business } = payload;

  if (variant === "classic") {
    return (
      <ClassicSection
        id={sectionId}
        eyebrow="Reservations"
        title="Book a table"
        className="scroll-mt-8"
      >
        <div className="rounded-[var(--meridian-radius)] border border-[color-mix(in_srgb,var(--client-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--client-primary)_4%,var(--client-background))] p-4 sm:p-6">
          <BookingWidget
            businessName={business.name}
            businessSlug={business.slug}
            bookingMode={booking.settings.booking_mode}
            externalBookingUrl={booking.settings.external_booking_url}
            services={booking.services}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            embed
          />
        </div>
      </ClassicSection>
    );
  }

  return (
    <BookingWidget
      businessName={business.name}
      businessSlug={business.slug}
      bookingMode={booking.settings.booking_mode}
      externalBookingUrl={booking.settings.external_booking_url}
      services={booking.services}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
      className="rounded-[var(--meridian-radius-lg)] border border-meridian-border bg-meridian-surface p-4"
    />
  );
}
