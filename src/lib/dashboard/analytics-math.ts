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
    no_show: 0,
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

export type RequestsPeriod = "daily" | "weekly" | "monthly";

export type PeriodCount = {
  key: string;
  label: string;
  count: number;
};

export function parseRequestsPeriod(value?: string): RequestsPeriod {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

/** Range + empty buckets for the booking-requests chart period control. */
export function resolveRequestsPeriodRange(
  period: RequestsPeriod,
  weekAnchor?: string,
): { from: string; to: string; buckets: PeriodCount[]; rangeLabel: string } {
  if (period === "daily") {
    const week = resolveWeekRange(weekAnchor);
    const buckets: PeriodCount[] = [];
    let cursor = parseLocalDate(week.from);
    const end = parseLocalDate(week.to);
    while (cursor <= end) {
      const key = formatLocalDate(cursor);
      buckets.push({
        key,
        label: cursor.toLocaleDateString("en-GB", { weekday: "short" }),
        count: 0,
      });
      cursor = addDays(cursor, 1);
    }
    return {
      from: week.from,
      to: week.to,
      buckets,
      rangeLabel: formatWeekLabel(week.from, week.to),
    };
  }

  if (period === "weekly") {
    const thisWeek = resolveWeekRange(weekAnchor);
    const startMonday = addDays(parseLocalDate(thisWeek.from), -7 * 7);
    const buckets: PeriodCount[] = [];
    for (let i = 0; i < 8; i += 1) {
      const monday = addDays(startMonday, i * 7);
      const key = formatLocalDate(monday);
      buckets.push({
        key,
        label: monday.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        count: 0,
      });
    }
    const from = formatLocalDate(startMonday);
    const to = thisWeek.to;
    return {
      from,
      to,
      buckets,
      rangeLabel: `8 weeks ending ${formatWeekLabel(thisWeek.from, thisWeek.to)}`,
    };
  }

  // monthly — last 6 calendar months including current
  const anchor = weekAnchor ? parseLocalDate(weekAnchor) : new Date();
  const endMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const startMonth = new Date(
    endMonth.getFullYear(),
    endMonth.getMonth() - 5,
    1,
    12,
  );
  const buckets: PeriodCount[] = [];
  for (let i = 0; i < 6; i += 1) {
    const month = new Date(
      startMonth.getFullYear(),
      startMonth.getMonth() + i,
      1,
      12,
    );
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: month.toLocaleDateString("en-GB", { month: "short" }),
      count: 0,
    });
  }
  const last = new Date(
    endMonth.getFullYear(),
    endMonth.getMonth() + 1,
    0,
    12,
  );
  return {
    from: formatLocalDate(startMonth),
    to: formatLocalDate(last),
    buckets,
    rangeLabel: `${buckets[0]?.label} – ${buckets[buckets.length - 1]?.label} ${last.getFullYear()}`,
  };
}

export function fillPeriodBuckets(
  rows: Array<{ date: string }>,
  period: RequestsPeriod,
  buckets: PeriodCount[],
): PeriodCount[] {
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const row of rows) {
    let key = row.date;
    if (period === "weekly") {
      const week = resolveWeekRange(row.date);
      key = week.from;
    } else if (period === "monthly") {
      key = row.date.slice(0, 7);
    }
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return buckets.map((bucket) => ({
    ...bucket,
    count: counts.get(bucket.key) ?? 0,
  }));
}

/** Nice integer Y-axis ticks for table booking counts. */
export function niceTableTicks(maxValue: number, targetSteps = 5): number[] {
  const max = Math.max(1, maxValue);
  const rough = max / targetSteps;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const residual = rough / magnitude;
  let step: number;
  if (residual <= 1) step = magnitude;
  else if (residual <= 2) step = 2 * magnitude;
  else if (residual <= 5) step = 5 * magnitude;
  else step = 10 * magnitude;
  step = Math.max(1, Math.round(step));
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) {
    ticks.push(value);
  }
  return ticks;
}
