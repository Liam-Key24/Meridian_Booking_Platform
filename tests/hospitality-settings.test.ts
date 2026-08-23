import { describe, expect, it } from "vitest";
import {
  customTablesFromForm,
  holidaysFromForm,
  parseCustomTables,
  parseHolidays,
  parseWeeklyHours,
  weeklyHoursFromForm,
} from "@/lib/dashboard/hospitality-settings";

describe("hospitality-settings parsers", () => {
  it("parses custom tables and drops invalid rows", () => {
    expect(
      parseCustomTables([
        { label: "Booth A", seats: 10 },
        { label: "", seats: 4 },
        { label: "Bad", seats: 0 },
      ]),
    ).toEqual([{ label: "Booth A", seats: 10 }]);
  });

  it("parses and sorts holidays", () => {
    expect(
      parseHolidays([
        { date: "2026-12-26", label: "Boxing Day" },
        { date: "2026-12-25", label: "Christmas" },
      ]),
    ).toEqual([
      { date: "2026-12-25", label: "Christmas" },
      { date: "2026-12-26", label: "Boxing Day" },
    ]);
  });

  it("fills missing weekly hours from defaults", () => {
    const hours = parseWeeklyHours({
      monday: { open: "10:00", close: "21:00", closed: false },
    });
    expect(hours.monday).toEqual({
      open: "10:00",
      close: "21:00",
      closed: false,
    });
    expect(hours.sunday?.closed).toBe(true);
  });

  it("reads custom tables from form data", () => {
    const formData = new FormData();
    formData.append("customTableLabel", "Private");
    formData.append("customTableSeats", "12");
    formData.append("customTableLabel", "");
    formData.append("customTableSeats", "");
    expect(customTablesFromForm(formData)).toEqual([
      { label: "Private", seats: 12 },
    ]);
  });

  it("rejects invalid opening hours from form data", () => {
    const formData = new FormData();
    for (const day of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]) {
      formData.set(`opening.${day}.open`, "18:00");
      formData.set(`opening.${day}.close`, "10:00");
    }
    expect(weeklyHoursFromForm(formData, "opening")).toBeNull();
  });

  it("reads holidays from form data", () => {
    const formData = new FormData();
    formData.append("holidayDate", "2026-01-01");
    formData.append("holidayLabel", "New Year");
    expect(holidaysFromForm(formData)).toEqual([
      { date: "2026-01-01", label: "New Year" },
    ]);
  });
});
