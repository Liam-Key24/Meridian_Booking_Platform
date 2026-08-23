export type CalendarView = "day" | "week";

export type CalendarQuery = {
  view: CalendarView;
  date: string; // YYYY-MM-DD anchor
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse YYYY-MM-DD as a local calendar date (noon avoids DST edge cases). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-start week containing the given date. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 Sun … 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

export function todayLocalIso(): string {
  return formatLocalDate(new Date());
}

export function parseCalendarQuery(input: {
  view?: string;
  date?: string;
}): CalendarQuery {
  const view: CalendarView = input.view === "day" ? "day" : "week";
  const date =
    input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
      ? input.date
      : todayLocalIso();
  return { view, date };
}

export function calendarRange(query: CalendarQuery): {
  from: string;
  to: string;
  days: string[];
} {
  const anchor = parseLocalDate(query.date);
  if (query.view === "day") {
    const iso = formatLocalDate(anchor);
    return { from: iso, to: iso, days: [iso] };
  }

  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) =>
    formatLocalDate(addDays(start, i)),
  );
  return { from: days[0]!, to: days[6]!, days };
}

export function groupBookingsByDate<
  T extends { preferred_date: string; preferred_time: string },
>(bookings: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const booking of bookings) {
    const key = booking.preferred_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(booking);
  }
  for (const key of Object.keys(groups)) {
    groups[key]!.sort((a, b) =>
      a.preferred_time.localeCompare(b.preferred_time),
    );
  }
  return groups;
}

export function weekdayLabel(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

export function longDateLabel(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
