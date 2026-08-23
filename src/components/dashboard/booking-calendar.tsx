import Link from "next/link";
import type { BookingListItem } from "@/lib/dashboard/bookings";
import {
  longDateLabel,
  weekdayLabel,
  type CalendarView,
} from "@/lib/dashboard/calendar";
import { cn } from "@/lib/cn";

type BookingCalendarProps = {
  view: CalendarView;
  anchorDate: string;
  days: string[];
  bookingsByDate: Record<string, BookingListItem[]>;
  todayIso: string;
};

function timeLabel(time: string): string {
  return time.slice(0, 5);
}

function BookingChip({ booking }: { booking: BookingListItem }) {
  return (
    <Link
      href={`/dashboard/bookings/${booking.id}`}
      className="block rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2.5 py-2 transition-colors hover:border-meridian-blue hover:bg-meridian-surface-subtle"
    >
      <p className="text-xs font-semibold text-meridian-teal">
        {timeLabel(booking.preferred_time)}
      </p>
      <p className="truncate text-sm font-medium text-meridian-text">
        {booking.customer_name}
      </p>
      <p className="truncate text-xs text-meridian-text-muted">
        {booking.service?.name ?? "Service"}
      </p>
    </Link>
  );
}

export function BookingCalendar({
  view,
  anchorDate,
  days,
  bookingsByDate,
  todayIso,
}: BookingCalendarProps) {
  const prevHref =
    view === "day"
      ? `/dashboard/calendar?view=day&date=${shiftIso(anchorDate, -1)}`
      : `/dashboard/calendar?view=week&date=${shiftIso(anchorDate, -7)}`;
  const nextHref =
    view === "day"
      ? `/dashboard/calendar?view=day&date=${shiftIso(anchorDate, 1)}`
      : `/dashboard/calendar?view=week&date=${shiftIso(anchorDate, 7)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={prevHref}
            className="rounded-meridian-sm border border-meridian-border px-3 py-2 text-sm font-medium text-meridian-text hover:bg-meridian-surface-subtle"
          >
            Previous
          </Link>
          <Link
            href={`/dashboard/calendar?view=${view}&date=${todayIso}`}
            className="rounded-meridian-sm border border-meridian-border px-3 py-2 text-sm font-medium text-meridian-text hover:bg-meridian-surface-subtle"
          >
            Today
          </Link>
          <Link
            href={nextHref}
            className="rounded-meridian-sm border border-meridian-border px-3 py-2 text-sm font-medium text-meridian-text hover:bg-meridian-surface-subtle"
          >
            Next
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/calendar?view=week&date=${anchorDate}`}
            className={cn(
              "rounded-meridian-sm px-3 py-2 text-sm font-semibold",
              view === "week"
                ? "bg-meridian-teal text-meridian-text-inverse"
                : "text-meridian-text-muted hover:bg-meridian-surface-subtle",
            )}
          >
            Week
          </Link>
          <Link
            href={`/dashboard/calendar?view=day&date=${anchorDate}`}
            className={cn(
              "rounded-meridian-sm px-3 py-2 text-sm font-semibold",
              view === "day"
                ? "bg-meridian-teal text-meridian-text-inverse"
                : "text-meridian-text-muted hover:bg-meridian-surface-subtle",
            )}
          >
            Day
          </Link>
        </div>
      </div>

      {view === "day" ? (
        <DayColumn
          date={days[0]!}
          bookings={bookingsByDate[days[0]!] ?? []}
          isToday={days[0] === todayIso}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((day) => (
            <DayColumn
              key={day}
              date={day}
              bookings={bookingsByDate[day] ?? []}
              isToday={day === todayIso}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayColumn({
  date,
  bookings,
  isToday,
  compact = false,
}: {
  date: string;
  bookings: BookingListItem[];
  isToday: boolean;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[12rem] flex-col gap-2 rounded-meridian border bg-meridian-surface-subtle/50 p-3",
        isToday ? "border-meridian-blue" : "border-meridian-border",
      )}
    >
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
            {compact ? weekdayLabel(date) : longDateLabel(date)}
          </p>
          {compact ? (
            <span
              className={cn(
                "text-sm font-semibold",
                isToday ? "text-meridian-teal" : "text-meridian-text",
              )}
            >
              {date.slice(8)}
            </span>
          ) : null}
        </div>
        <Link
          href={`/dashboard/bookings/new?date=${date}`}
          className="text-xs font-semibold text-meridian-teal hover:underline"
        >
          + Add booking
        </Link>
      </header>

      {bookings.length === 0 ? (
        <p className="text-xs text-meridian-text-muted">No confirmed bookings</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((booking) => (
            <BookingChip key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </section>
  );
}

function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
