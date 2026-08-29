import { BookingWidget } from "@/components/booking/booking-widget";
import type { PublicBookingPage } from "@/lib/booking/public-page";

type HospitalityBookingSectionProps = {
  businessName: string;
  businessSlug: string;
  booking: PublicBookingPage;
  turnstileSiteKey?: string | null;
  id?: string;
  className?: string;
};

export function HospitalityBookingSection({
  businessName,
  businessSlug,
  booking,
  turnstileSiteKey = null,
  id = "book",
  className,
}: HospitalityBookingSectionProps) {
  return (
    <section
      id={id}
      className={
        className ??
        "mx-auto max-w-3xl scroll-mt-8 px-[var(--meridian-space-page)] py-16"
      }
    >
      <div className="mb-8 space-y-3 text-center">
        <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Reserve Your Table
        </h2>
        <p className="text-sm text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]">
          Select your preferred date and time. We look forward to welcoming you.
        </p>
      </div>
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--client-text)_8%,transparent)] bg-[var(--client-background)] p-6 shadow-[0_20px_60px_color-mix(in_srgb,var(--client-text)_8%,transparent)] sm:p-8">
        <BookingWidget
          businessName={businessName}
          businessSlug={businessSlug}
          bookingMode={booking.settings.booking_mode}
          externalBookingUrl={booking.settings.external_booking_url}
          services={booking.services}
          turnstileSiteKey={turnstileSiteKey}
          dashboardMode={booking.dashboardMode}
          maxPartySize={booking.settings.max_party_size}
          embed
          submitLabel="Find a Table"
          className="[&_button]:rounded-full [&_button]:bg-[var(--client-text)] [&_button]:text-[var(--client-background)]"
        />
      </div>
    </section>
  );
}
