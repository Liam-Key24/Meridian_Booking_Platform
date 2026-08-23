import { describe, expect, it } from "vitest";
import {
  aggregateServiceCounts,
  bucketByDay,
  countByStatus,
  emptyStatusCounts,
  fillPeriodBuckets,
  niceTableTicks,
  resolveRequestsPeriodRange,
  resolveWeekRange,
} from "@/lib/dashboard/analytics-math";

describe("dashboard analytics math", () => {
  it("counts statuses accurately", () => {
    const counts = countByStatus([
      { status: "pending" },
      { status: "pending" },
      { status: "confirmed" },
      { status: "declined" },
    ]);
    expect(counts.pending).toBe(2);
    expect(counts.confirmed).toBe(1);
    expect(counts.declined).toBe(1);
    expect(counts.cancelled).toBe(0);
  });

  it("returns empty counts for zero bookings", () => {
    expect(countByStatus([])).toEqual(emptyStatusCounts());
  });

  it("buckets contiguous days including zeros", () => {
    const series = bucketByDay(
      [{ date: "2026-09-02" }, { date: "2026-09-02" }, { date: "2026-09-04" }],
      "2026-09-01",
      "2026-09-04",
    );
    expect(series).toEqual([
      { date: "2026-09-01", count: 0 },
      { date: "2026-09-02", count: 2 },
      { date: "2026-09-03", count: 0 },
      { date: "2026-09-04", count: 1 },
    ]);
  });

  it("aggregates service counts and sorts descending", () => {
    const top = aggregateServiceCounts([
      { service_id: "a", service_name: "Cut" },
      { service_id: "b", service_name: "Colour" },
      { service_id: "a", service_name: "Cut" },
      { service_id: null, service_name: null },
    ]);
    expect(top[0]?.name).toBe("Cut");
    expect(top[0]?.count).toBe(2);
  });

  it("resolves a Monday–Sunday week from an anchor date", () => {
    const week = resolveWeekRange("2026-08-19");
    expect(week.from).toBe("2026-08-17");
    expect(week.to).toBe("2026-08-23");
    expect(week.days).toBe(7);
    expect(week.prevWeekStart).toBe("2026-08-10");
    expect(week.nextWeekStart).toBe("2026-08-24");
  });

  it("builds daily table buckets for a week", () => {
    const range = resolveRequestsPeriodRange("daily", "2026-08-19");
    expect(range.buckets).toHaveLength(7);
    expect(range.buckets[0]?.label).toBe("Mon");
    const filled = fillPeriodBuckets(
      [{ date: "2026-08-17" }, { date: "2026-08-17" }, { date: "2026-08-19" }],
      "daily",
      range.buckets,
    );
    expect(filled[0]?.count).toBe(2);
    expect(filled[2]?.count).toBe(1);
  });

  it("creates nice integer table ticks", () => {
    expect(niceTableTicks(1)).toEqual([0, 1]);
    expect(niceTableTicks(7).at(-1)).toBeGreaterThanOrEqual(7);
    expect(niceTableTicks(0)[0]).toBe(0);
  });
});
