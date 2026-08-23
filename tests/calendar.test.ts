import { describe, expect, it } from "vitest";
import {
  calendarRange,
  formatLocalDate,
  parseCalendarQuery,
  parseLocalDate,
  startOfWeek,
} from "@/lib/dashboard/calendar";

describe("calendar helpers", () => {
  it("defaults to week view and a valid date", () => {
    const query = parseCalendarQuery({});
    expect(query.view).toBe("week");
    expect(query.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("builds a Monday-start week range", () => {
    // 2026-09-02 is a Wednesday
    const range = calendarRange({ view: "week", date: "2026-09-02" });
    expect(range.from).toBe("2026-08-31");
    expect(range.to).toBe("2026-09-06");
    expect(range.days).toHaveLength(7);
  });

  it("builds a single-day range", () => {
    const range = calendarRange({ view: "day", date: "2026-09-02" });
    expect(range.days).toEqual(["2026-09-02"]);
  });

  it("finds Monday as start of week", () => {
    const wednesday = parseLocalDate("2026-09-02");
    expect(formatLocalDate(startOfWeek(wednesday))).toBe("2026-08-31");
  });
});
