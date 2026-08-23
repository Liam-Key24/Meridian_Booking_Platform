import { EmptyState, ErrorState } from "@/components/ui";
import { BookingWidget } from "@/components/booking/booking-widget";
import { getPublicBookingPage } from "@/lib/booking/public-page";

type BookPageProps = {
  params: Promise<{ businessSlug: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { businessSlug } = await params;

  let page = null;
  let loadError: string | null = null;

  try {
    page = await getPublicBookingPage(businessSlug);
  } catch (error) {
    console.error("[book] failed to load page", error);
    loadError = "Booking is temporarily unavailable. Please try again later.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <ErrorState title="Unable to load booking" description={loadError} />
      </main>
    );
  }

  if (!page) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <EmptyState
          title="Business not found"
          description="This booking page is unavailable or the business is not accepting Meridian requests."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
      <BookingWidget
        businessName={page.business.name}
        businessSlug={page.business.slug}
        bookingMode={page.settings.booking_mode}
        externalBookingUrl={page.settings.external_booking_url}
        services={page.services}
      />
    </main>
  );
}
