import { BookingWidget } from "@/components/booking/booking-widget";
import type { ClientSiteSectionProps } from "@/components/client-site/sections/section-shell";

export function BookingWidgetSection({ payload }: ClientSiteSectionProps) {
  const { booking, business } = payload;
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
