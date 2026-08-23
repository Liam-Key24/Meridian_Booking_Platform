import { Badge, Card, EmptyState } from "@/components/ui";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import type { BookingMode } from "@/types/database";

export type BookingWidgetService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
};

export type BookingWidgetProps = {
  businessName: string;
  businessSlug: string;
  bookingMode: BookingMode;
  externalBookingUrl: string | null;
  services: BookingWidgetService[];
  turnstileSiteKey?: string | null;
  /** Optional className for embed layouts on Meridian client sites. */
  className?: string;
};

/**
 * Reusable public booking surface for Meridian client templates.
 * Supports meridian / external / hybrid modes — no calendar-provider sync.
 */
export function BookingWidget({
  businessName,
  businessSlug,
  bookingMode,
  externalBookingUrl,
  services,
  turnstileSiteKey,
  className,
}: BookingWidgetProps) {
  if (bookingMode === "external") {
    return (
      <div className={className}>
        <ExternalBookingPanel
          businessName={businessName}
          externalBookingUrl={externalBookingUrl}
        />
      </div>
    );
  }

  const showExternal = bookingMode === "hybrid" && Boolean(externalBookingUrl);

  return (
    <div className={className}>
      <div className="space-y-8">
        <header className="space-y-3">
          <Badge tone="soft">
            {bookingMode === "hybrid" ? "Hybrid booking" : "Public booking"}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            {businessName}
          </h1>
          <p className="text-meridian-text-muted">
            {bookingMode === "hybrid"
              ? "Request a time through Meridian, or continue with the business’s existing booking provider."
              : "Submit a request. This does not confirm your booking."}
          </p>
        </header>

        {showExternal ? (
          <Card
            title="Book with existing provider"
            description="Prefer the business’s usual booking system."
          >
            <a
              href={externalBookingUrl!}
              className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-accent px-5 text-sm font-semibold text-meridian-text"
              rel="noopener noreferrer"
              target="_blank"
            >
              Continue to booking provider
            </a>
          </Card>
        ) : null}

        <Card
          title="Request via Meridian"
          description="We’ll send your preferred time to the business for review."
        >
          {services.length === 0 ? (
            <EmptyState
              title="No services available"
              description="This business has not published bookable services yet."
            />
          ) : (
            <BookingRequestForm
              businessSlug={businessSlug}
              businessName={businessName}
              services={services}
              turnstileSiteKey={turnstileSiteKey}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function ExternalBookingPanel({
  businessName,
  externalBookingUrl,
}: {
  businessName: string;
  externalBookingUrl: string | null;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge tone="soft">External booking</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          {businessName}
        </h1>
        <p className="text-meridian-text-muted">
          This business uses an external booking provider.
        </p>
      </header>
      {externalBookingUrl ? (
        <Card>
          <a
            href={externalBookingUrl}
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
    </div>
  );
}
