import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
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
  searchParams: Promise<{
    view?: string;
    date?: string;
  }>;
};

export default async function DashboardCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
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

  const query = parseCalendarQuery(params);
  const range = calendarRange(query);
  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    {
      status: "confirmed",
      from: range.from,
      to: range.to,
    },
  );
  const bookingsByDate = groupBookingsByDate(bookings);
  const todayIso = todayLocalIso();

  const heading =
    query.view === "day"
      ? longDateLabel(range.days[0]!)
      : `${longDateLabel(range.from)} – ${longDateLabel(range.to)}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="blue">Calendar</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Confirmed bookings
          </h1>
          <p className="text-meridian-text-muted">{heading}</p>
        </div>
        <Link
          href={`/dashboard/bookings/new?date=${query.date}`}
          className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse"
        >
          New booking
        </Link>
      </header>

      <Card
        title={query.view === "day" ? "Day view" : "Week view"}
        description="Confirmed bookings only — no live availability or external calendar sync."
      >
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
      </Card>

      {!error && bookings.length === 0 ? (
        <EmptyState
          title="No confirmed bookings in this range"
          description="Approve a request or add a manual booking to see it here."
        />
      ) : null}
    </main>
  );
}
