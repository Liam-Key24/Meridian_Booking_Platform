import Link from "next/link";
import { Badge, EmptyState, ErrorState } from "@/components/ui";
import { BookingCalendar } from "@/components/dashboard/booking-calendar";
import {
  calendarRange,
  groupBookingsByDate,
  longDateLabel,
  parseCalendarQuery,
  todayLocalIso,
} from "@/lib/dashboard/calendar";
import { listBookingsForBusiness } from "@/lib/dashboard/bookings";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

type PageProps = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

export default async function DashboardCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const query = parseCalendarQuery(params);
  const range = calendarRange(query);
  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    { status: "confirmed", from: range.from, to: range.to },
  );
  const bookingsByDate = groupBookingsByDate(bookings);
  const todayIso = todayLocalIso();
  const heading =
    query.view === "day"
      ? longDateLabel(range.days[0]!)
      : `${longDateLabel(range.from)} – ${longDateLabel(range.to)}`;

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="blue">Calendar</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Confirmed bookings
          </h2>
          <p className="text-meridian-text-muted">{heading}</p>
        </div>
        <Link
          href={`/dashboard/bookings/new?date=${query.date}`}
          className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse"
        >
          New booking
        </Link>
      </header>

      <section className="w-full rounded-meridian border border-meridian-border bg-meridian-surface p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-meridian-text">
            {query.view === "day" ? "Day view" : "Week view"}
          </h3>
          <p className="text-sm text-meridian-text-muted">
            Confirmed bookings only — no live availability or external calendar
            sync.
          </p>
        </div>
        {error ? (
          <ErrorState title="Could not load calendar" description={error} />
        ) : (
          <BookingCalendar
            view={query.view}
            anchorDate={query.date}
            days={range.days}
            bookingsByDate={bookingsByDate}
            todayIso={todayIso}
          />
        )}
      </section>

      {!error && bookings.length === 0 ? (
        <EmptyState
          title="No confirmed bookings in this range"
          description="Approve a request or add a manual booking to see it here."
        />
      ) : null}
    </main>
  );
}
