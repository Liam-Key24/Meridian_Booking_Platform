import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { BookingList } from "@/components/dashboard/booking-list";
import { listBookingsForBusiness } from "@/lib/dashboard/bookings";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

export default async function DashboardPendingPage() {
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    { status: "pending" },
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="teal">Pending queue</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Pending bookings
          </h1>
          <p className="text-meridian-text-muted">
            Review new requests for {context.business.name}. Open a booking to
            approve, decline, or suggest another time.
          </p>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-sm font-semibold text-meridian-teal hover:underline"
        >
          View all bookings
        </Link>
      </header>

      <Card
        title="Requests awaiting review"
        description="Loaded with your session under Row Level Security."
      >
        {error ? (
          <ErrorState title="Could not load bookings" description={error} />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No pending bookings"
            description="When customers submit requests, they will appear here."
          />
        ) : (
          <BookingList bookings={bookings} />
        )}
      </Card>
    </main>
  );
}
