import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { BookingFilters } from "@/components/dashboard/booking-filters";
import { BookingList } from "@/components/dashboard/booking-list";
import {
  listBookingsForBusiness,
  type BookingFilters as Filters,
} from "@/lib/dashboard/bookings";
import { requireDashboardContext } from "@/lib/dashboard/require-context";
import type { BookingStatus } from "@/types/database";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
  }>;
};

function parseStatus(value?: string): Filters["status"] {
  const allowed: Array<BookingStatus | "all"> = [
    "all",
    "pending",
    "confirmed",
    "declined",
    "cancelled",
    "suggested",
  ];
  if (value && allowed.includes(value as BookingStatus | "all")) {
    return value as BookingStatus | "all";
  }
  return "all";
}

export default async function DashboardBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="flex w-full flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const status = parseStatus(params.status);
  const from = params.from ?? "";
  const to = params.to ?? "";

  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    { status, from: from || undefined, to: to || undefined },
  );

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8">
      <header className="space-y-2">
        <Badge tone="blue">Bookings</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          All bookings
        </h1>
        <p className="text-meridian-text-muted">
          Filter by status and preferred date for {context.business.name}.
        </p>
      </header>

      <BookingFilters status={status ?? "all"} from={from} to={to} />

      <Card title="Results" description={`${bookings.length} booking(s)`}>
        {error ? (
          <ErrorState title="Could not load bookings" description={error} />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings match"
            description="Try clearing filters or wait for new customer requests."
          />
        ) : (
          <BookingList bookings={bookings} />
        )}
      </Card>
    </main>
  );
}
