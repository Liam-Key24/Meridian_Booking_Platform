import type { BookingStatus } from "@/types/database";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
} from "@/lib/dashboard/calendar";

export type StatusCounts = Record<BookingStatus, number>;
export type DayCount = { date: string; count: number };
export type ServiceCount = {
  serviceId: string | null;
  name: string;
  count: number;
};

export function emptyStatusCounts(): StatusCounts {
  return {
    pending: 0,
    confirmed: 0,
    declined: 0,
    cancelled: 0,
    suggested: 0,
  };
}

export function countByStatus(
  rows: Array<{ status: BookingStatus }>,
): StatusCounts {
  const counts = emptyStatusCounts();
  for (const row of rows) {
    counts[row.status] += 1;
  }
  return counts;
}

export function bucketByDay(
  rows: Array<{ date: string }>,
  from: string,
  to: string,
): DayCount[] {
  const map = new Map<string, number>();
  let cursor = parseLocalDate(from);
  const end = parseLocalDate(to);
  while (cursor <= end) {
    map.set(formatLocalDate(cursor), 0);
    cursor = addDays(cursor, 1);
  }
  for (const row of rows) {
    if (map.has(row.date)) {
      map.set(row.date, (map.get(row.date) ?? 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export function aggregateServiceCounts(
  rows: Array<{ service_id: string | null; service_name: string | null }>,
): ServiceCount[] {
  const map = new Map<string, ServiceCount>();
  for (const row of rows) {
    const key = row.service_id ?? "none";
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        serviceId: row.service_id,
        name: row.service_name ?? "Unknown service",
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function resolveDashboardRange(days = 30): {
  from: string;
  to: string;
  days: number;
} {
  const to = formatLocalDate(new Date());
  const from = formatLocalDate(addDays(new Date(), -(days - 1)));
  return { from, to, days };
}

/** Monday–Sunday week containing `anchor` (YYYY-MM-DD), defaulting to today. */
export function resolveWeekRange(anchor?: string): {
  from: string;
  to: string;
  days: number;
  prevWeekStart: string;
  nextWeekStart: string;
} {
  const base = anchor ? parseLocalDate(anchor) : new Date();
  const day = base.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(base, mondayOffset);
  const sunday = addDays(monday, 6);
  return {
    from: formatLocalDate(monday),
    to: formatLocalDate(sunday),
    days: 7,
    prevWeekStart: formatLocalDate(addDays(monday, -7)),
    nextWeekStart: formatLocalDate(addDays(monday, 7)),
  };
}

export function formatWeekLabel(from: string, to: string): string {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startLabel = start.toLocaleDateString("en-GB", opts);
  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric",
  });
  const year = sameYear ? ` ${end.getFullYear()}` : "";
  return `${startLabel} – ${endLabel}${year}`;
}
