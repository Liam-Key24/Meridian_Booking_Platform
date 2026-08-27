import {
  parseHolidays,
  parseWeeklyHours,
  WEEKDAYS,
  type HolidayEntry,
  type WeeklyHours,
} from "@/lib/dashboard/hospitality-settings";

function weekdayFromDate(date: string): (typeof WEEKDAYS)[number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month - 1 ||
    local.getDate() !== day
  ) {
    return null;
  }
  return WEEKDAYS[(local.getDay() + 6) % 7]!;
}

function timeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Whether preferred date/time falls within weekly hours and outside holidays.
 * Overnight closes (close < open) are treated as closed for that slot (MVP).
 */
export function isPreferredSlotOpen(options: {
  preferredDate: string;
  preferredTime: string;
  openingHours: unknown;
  holidays?: unknown;
}): { ok: true } | { ok: false; error: string } {
  const hours = parseWeeklyHours(options.openingHours);
  const holidays = parseHolidays(options.holidays);

  if (holidays.some((entry: HolidayEntry) => entry.date === options.preferredDate)) {
    return {
      ok: false,
      error: "That date is closed. Please choose another day.",
    };
  }

  const weekday = weekdayFromDate(options.preferredDate);
  if (!weekday) {
    return { ok: false, error: "Please choose a preferred date." };
  }

  const day = hours[weekday];
  if (!day || day.closed) {
    return {
      ok: false,
      error: "The business is closed on that day. Please choose another day.",
    };
  }

  const preferred = timeToMinutes(options.preferredTime);
  const open = timeToMinutes(day.open);
  const close = timeToMinutes(day.close);
  if (preferred === null || open === null || close === null) {
    return { ok: false, error: "Please choose a preferred time." };
  }

  if (close <= open) {
    return {
      ok: false,
      error: "That time is outside opening hours. Please choose another time.",
    };
  }

  if (preferred < open || preferred >= close) {
    return {
      ok: false,
      error: `Please choose a time between ${day.open} and ${day.close}.`,
    };
  }

  return { ok: true };
}

export function describeOpeningHours(openingHours: unknown): WeeklyHours {
  return parseWeeklyHours(openingHours);
}
