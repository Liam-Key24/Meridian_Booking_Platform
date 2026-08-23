import { Badge, Card, EmptyState, ErrorState } from "@/components/ui";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
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

  if (page.settings.booking_mode === "external") {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
        <header className="space-y-3">
          <Badge tone="soft">External booking</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            {page.business.name}
          </h1>
          <p className="text-meridian-text-muted">
            This business uses an external booking provider.
          </p>
        </header>
        {page.settings.external_booking_url ? (
          <Card>
            <a
              href={page.settings.external_booking_url}
              className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse"
              rel="noopener noreferrer"
              target="_blank"
            >
              Continue to booking provider
            </a>
          </Card>
        ) : (
          <EmptyState
            title="External link not configured"
            description="Please contact the business directly."
          />
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
      <header className="space-y-3">
        <Badge tone="soft">Public booking</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Request a booking
        </h1>
        <p className="text-meridian-text-muted">
          Submit a request to{" "}
          <span className="font-medium text-meridian-text">
            {page.business.name}
          </span>
          . This does not confirm your booking.
        </p>
      </header>

      <Card
        title="Booking request"
        description="We’ll send your preferred time to the business for review."
      >
        {page.services.length === 0 ? (
          <EmptyState
            title="No services available"
            description="This business has not published bookable services yet."
          />
        ) : (
          <BookingRequestForm
            businessSlug={page.business.slug}
            businessName={page.business.name}
            services={page.services}
          />
        )}
      </Card>
    </main>
  );
}
