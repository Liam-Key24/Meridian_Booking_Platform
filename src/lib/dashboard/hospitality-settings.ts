export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type WeeklyHours = Partial<Record<Weekday, DayHours>>;

export type CustomTable = {
  label: string;
  seats: number;
};

export type HolidayEntry = {
  date: string;
  label: string;
};

export type KitchenCloseTimes = Partial<Record<Weekday, string>>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_DAY_HOURS: DayHours = {
  open: "09:00",
  close: "22:00",
  closed: false,
};

export function defaultWeeklyHours(): WeeklyHours {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      {
        ...DEFAULT_DAY_HOURS,
        closed: day === "sunday",
      },
    ]),
  ) as WeeklyHours;
}

export function defaultBarHours(): WeeklyHours {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      {
        open: "11:00",
        close: "23:00",
        closed: day === "sunday",
      },
    ]),
  ) as WeeklyHours;
}

export function defaultKitchenCloseTimes(): KitchenCloseTimes {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [day, day === "sunday" ? "" : "21:00"]),
  ) as KitchenCloseTimes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseWeeklyHours(value: unknown): WeeklyHours {
  const fallback = defaultWeeklyHours();
  if (!isRecord(value)) return fallback;

  const result: WeeklyHours = {};
  for (const day of WEEKDAYS) {
    const raw = value[day];
    if (!isRecord(raw)) {
      result[day] = fallback[day];
      continue;
    }
    const open = typeof raw.open === "string" && TIME_RE.test(raw.open)
      ? raw.open
      : fallback[day]!.open;
    const close = typeof raw.close === "string" && TIME_RE.test(raw.close)
      ? raw.close
      : fallback[day]!.close;
    const closed = Boolean(raw.closed);
    result[day] = { open, close, closed };
  }
  return result;
}

/** Compact label for today's opening hours, e.g. "Today 09:00–22:00". */
export function todayOpeningLabel(
  hours: WeeklyHours,
  now = new Date(),
): string {
  const weekday = WEEKDAYS[(now.getDay() + 6) % 7]!;
  const day = hours[weekday];
  if (!day || day.closed) return "Closed today";
  return `Today ${day.open}–${day.close}`;
}

export function parseKitchenCloseTimes(value: unknown): KitchenCloseTimes {
  const fallback = defaultKitchenCloseTimes();
  if (!isRecord(value)) return fallback;

  const result: KitchenCloseTimes = {};
  for (const day of WEEKDAYS) {
    const raw = value[day];
    if (typeof raw === "string" && (raw === "" || TIME_RE.test(raw))) {
      result[day] = raw;
    } else {
      result[day] = fallback[day];
    }
  }
  return result;
}

export function parseCustomTables(value: unknown): CustomTable[] {
  if (!Array.isArray(value)) return [];
  const tables: CustomTable[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const seats =
      typeof item.seats === "number"
        ? item.seats
        : typeof item.seats === "string"
          ? Number(item.seats)
          : NaN;
    if (!label || !Number.isInteger(seats) || seats < 1 || seats > 100) continue;
    tables.push({ label: label.slice(0, 80), seats });
  }
  return tables;
}

export function parseHolidays(value: unknown): HolidayEntry[] {
  if (!Array.isArray(value)) return [];
  const holidays: HolidayEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const date = typeof item.date === "string" ? item.date.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!DATE_RE.test(date)) continue;
    holidays.push({
      date,
      label: (label || "Closed").slice(0, 120),
    });
  }
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

export function parseNonNegativeInt(
  value: FormDataEntryValue | null,
  fallback = 0,
): number {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return Number.NaN;
  return n;
}

export function parseOptionalPositiveInt(
  value: FormDataEntryValue | null,
): number | null | typeof Number.NaN {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return Number.NaN;
  return n;
}

export function weeklyHoursFromForm(
  formData: FormData,
  prefix: string,
): WeeklyHours | null {
  const result: WeeklyHours = {};
  for (const day of WEEKDAYS) {
    const closed = formData.get(`${prefix}.${day}.closed`) === "on";
    const open = String(formData.get(`${prefix}.${day}.open`) ?? "").trim();
    const close = String(formData.get(`${prefix}.${day}.close`) ?? "").trim();
    if (!closed) {
      if (!TIME_RE.test(open) || !TIME_RE.test(close)) return null;
      if (open >= close) return null;
    }
    result[day] = {
      open: TIME_RE.test(open) ? open : DEFAULT_DAY_HOURS.open,
      close: TIME_RE.test(close) ? close : DEFAULT_DAY_HOURS.close,
      closed,
    };
  }
  return result;
}

export function kitchenCloseFromForm(
  formData: FormData,
): KitchenCloseTimes | null {
  const result: KitchenCloseTimes = {};
  for (const day of WEEKDAYS) {
    const value = String(formData.get(`kitchenClose.${day}`) ?? "").trim();
    if (value && !TIME_RE.test(value)) return null;
    result[day] = value;
  }
  return result;
}

export function customTablesFromForm(formData: FormData): CustomTable[] | null {
  const labels = formData.getAll("customTableLabel").map((v) => String(v).trim());
  const seatsRaw = formData.getAll("customTableSeats").map((v) => String(v).trim());
  if (labels.length !== seatsRaw.length) return null;

  const tables: CustomTable[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const seats = Number(seatsRaw[i]);
    if (!label && !seatsRaw[i]) continue;
    if (!label || !Number.isInteger(seats) || seats < 1 || seats > 100) {
      return null;
    }
    tables.push({ label: label.slice(0, 80), seats });
  }
  return tables;
}

export function holidaysFromForm(formData: FormData): HolidayEntry[] | null {
  const dates = formData.getAll("holidayDate").map((v) => String(v).trim());
  const labels = formData.getAll("holidayLabel").map((v) => String(v).trim());
  if (dates.length !== labels.length) return null;

  const holidays: HolidayEntry[] = [];
  for (let i = 0; i < dates.length; i += 1) {
    const date = dates[i];
    const label = labels[i];
    if (!date && !label) continue;
    if (!DATE_RE.test(date)) return null;
    holidays.push({
      date,
      label: (label || "Closed").slice(0, 120),
    });
  }
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}
