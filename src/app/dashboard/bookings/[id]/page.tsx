import Link from "next/link";
import { BookingActionsPanel } from "@/components/dashboard/booking-actions-panel";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  StatusLabel,
} from "@/components/ui";
import {
  getBookingForBusiness,
  listBookingEvents,
} from "@/lib/dashboard/bookings";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatEventType(eventType: string): string {
  return eventType.replace(/^booking\./, "").replaceAll("_", " ");
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const { data: booking, error } = await getBookingForBusiness(
    context.business.id,
    id,
  );

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <ErrorState title="Could not load booking" description={error} />
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <EmptyState
          title="Booking not found"
          description="This booking does not exist or belongs to another business."
        />
      </main>
    );
  }

  const { data: events } = await listBookingEvents(context.business.id, id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-meridian-teal hover:underline"
        >
          ← Back to pending
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="teal">Booking detail</Badge>
          <StatusLabel status={booking.status} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          {booking.customer_name}
        </h1>
      </div>

      <Card title="Request details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Service
            </dt>
            <dd className="mt-1 text-meridian-text">
              {booking.service?.name ?? "Service removed"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Preferred time
            </dt>
            <dd className="mt-1 text-meridian-text">
              {booking.preferred_date} at {booking.preferred_time.slice(0, 5)}
            </dd>
          </div>
          {booking.suggested_date ? (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                Suggested time
              </dt>
              <dd className="mt-1 text-meridian-text">
                {booking.suggested_date} at{" "}
                {(booking.suggested_time ?? "").slice(0, 5)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Email
            </dt>
            <dd className="mt-1 text-meridian-text">{booking.customer_email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Phone
            </dt>
            <dd className="mt-1 text-meridian-text">
              {booking.customer_phone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Guests
            </dt>
            <dd className="mt-1 text-meridian-text">
              {booking.guest_count ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Submitted
            </dt>
            <dd className="mt-1 text-meridian-text">
              {new Date(booking.created_at).toLocaleString()}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Notes
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-meridian-text">
              {booking.notes || "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Actions">
        <BookingActionsPanel
          businessId={context.business.id}
          bookingId={booking.id}
          status={booking.status}
          suggestedDate={booking.suggested_date}
          suggestedTime={booking.suggested_time}
        />
      </Card>

      <Card title="Status history">
        {events.length === 0 ? (
          <p className="text-sm text-meridian-text-muted">No events yet.</p>
        ) : (
          <ol className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="border-b border-meridian-border pb-3 last:border-0 last:pb-0"
              >
                <p className="font-medium capitalize text-meridian-text">
                  {formatEventType(event.event_type)}
                </p>
                <p className="text-xs text-meridian-text-muted">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </main>
  );
}
