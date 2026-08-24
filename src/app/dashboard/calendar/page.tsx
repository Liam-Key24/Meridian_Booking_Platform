import { ErrorState } from "@/components/ui";
import { BookingCalendar } from "@/components/dashboard/booking-calendar";
import {
  calendarRange,
  calendarRangeLabel,
  parseCalendarQuery,
  todayLocalIso,
} from "@/lib/dashboard/calendar";
import { listBookingsForBusiness } from "@/lib/dashboard/bookings";
import { requireDashboardCapability } from "@/lib/dashboard/require-context";

type PageProps = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

export default async function DashboardCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireDashboardCapability("calendar");

  const query = parseCalendarQuery(params);
  const range = calendarRange(query);
  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    { status: "confirmed", from: range.from, to: range.to },
  );
  const todayIso = todayLocalIso();

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-6 lg:py-8">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Confirmed bookings
        </h2>
      </header>

      <section className="w-full rounded-meridian border border-meridian-border bg-meridian-surface p-4 sm:p-6">
        {error ? (
          <ErrorState title="Could not load calendar" description={error} />
        ) : (
          <BookingCalendar
            businessId={context.business.id}
            view={query.view}
            anchorDate={query.date}
            days={range.days}
            bookings={bookings}
            todayIso={todayIso}
            rangeLabel={calendarRangeLabel(query.view, range.from, range.to)}
          />
        )}
      </section>
    </main>
  );
}
