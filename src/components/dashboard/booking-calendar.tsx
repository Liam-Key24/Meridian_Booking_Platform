"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  ForkKnife,
  Users,
} from "@phosphor-icons/react";
import { BookingDetailPanel } from "@/components/dashboard/booking-detail-panel";
import { hasAllergies } from "@/components/dashboard/allergy-tags";
import { cn } from "@/lib/cn";
import type { BookingListItem } from "@/lib/dashboard/bookings";
import { weekdayLabel, type CalendarView } from "@/lib/dashboard/calendar";

type BookingCalendarProps = {
  businessId: string;
  view: CalendarView;
  anchorDate: string;
  days: string[];
  bookings: BookingListItem[];
  todayIso: string;
  rangeLabel: string;
};

/** Settings will supply the real table plan; a single table is the default. */
const DEFAULT_TABLES = ["1 of 1"];

/** Opening time placeholder until service hours live in settings. */
const DAY_VIEW_START_HOUR = 8;
const DAY_VIEW_END_HOUR = 21;

const TRACK_TEXTURE = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(20,58,68,0.045) 0 1px, transparent 1px 8px)",
};

function hourSlot(time: string): string {
  return `${time.slice(0, 2)}:00`;
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function minutesLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function startMinutes(booking: BookingListItem): number {
  const [hour, minute] = booking.preferred_time.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

/** Table lengths will come from the table editor and settings defaults. */
function durationMinutes(booking: BookingListItem): number {
  return booking.service?.duration_minutes ?? 60;
}

function guestsLabel(guestCount: number | null): string {
  if (guestCount == null) return "—";
  return `${guestCount} ${guestCount === 1 ? "guest" : "guests"}`;
}

function hasRequest(booking: BookingListItem): boolean {
  return Boolean(booking.notes?.trim());
}

function tableFor(booking: BookingListItem): string {
  return booking.assigned_table?.trim() || DEFAULT_TABLES[0]!;
}

function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function BookingCalendar({
  businessId,
  view,
  anchorDate,
  days,
  bookings,
  todayIso,
  rangeLabel,
}: BookingCalendarProps) {
  const router = useRouter();
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    selectedId == null
      ? null
      : (bookings.find((booking) => booking.id === selectedId) ?? null);

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
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-meridian-text">
            {view === "day" ? "Day view" : "Week view"}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-meridian-sm bg-meridian-surface-muted p-1">
              <Link
                href={prevHref}
                aria-label={view === "day" ? "Previous day" : "Previous week"}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-meridian-text-muted transition-colors hover:bg-meridian-surface hover:text-meridian-text"
              >
                <CaretLeft className="size-4" weight="bold" aria-hidden />
              </Link>
              <span className="rounded-meridian-sm bg-meridian-surface px-3 py-1 text-sm font-semibold text-meridian-text">
                {rangeLabel}
              </span>
              <Link
                href={nextHref}
                aria-label={view === "day" ? "Next day" : "Next week"}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-meridian-text-muted transition-colors hover:bg-meridian-surface hover:text-meridian-text"
              >
                <CaretRight className="size-4" weight="bold" aria-hidden />
              </Link>
            </div>

            <Link
              href={`/dashboard/calendar?view=${view}&date=${todayIso}`}
              className="cursor-pointer rounded-meridian-sm bg-meridian-surface-muted px-3 py-1.5 text-sm font-medium text-meridian-text transition-colors hover:bg-meridian-surface-subtle"
            >
              Today
            </Link>

            <div
              className="inline-flex rounded-meridian-sm bg-meridian-surface-muted p-0.5"
              role="group"
              aria-label="Calendar view"
            >
              {(["day", "week"] as CalendarView[]).map((option) => {
                const active = view === option;
                return (
                  <Link
                    key={option}
                    href={`/dashboard/calendar?view=${option}&date=${anchorDate}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "cursor-pointer rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-meridian-accent text-meridian-text"
                        : "text-meridian-text-muted hover:text-meridian-text",
                    )}
                  >
                    {option === "day" ? "Day" : "Weekly"}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-sm text-meridian-text-muted">
          Confirmed bookings only — no live availability or external calendar
          sync.
        </p>
      </div>

      {view === "day" ? (
        <DayTableGrid
          date={days[0]!}
          bookings={bookings}
          onOpen={(booking) => setSelectedId(booking.id)}
        />
      ) : (
        <WeekTimeBlocks
          days={days}
          bookings={bookings}
          todayIso={todayIso}
          onOpen={(booking) => setSelectedId(booking.id)}
        />
      )}

      {selected ? (
        <BookingDetailPanel
          key={selected.id}
          businessId={businessId}
          booking={selected}
          titleId={titleId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

/** Week view: one row per start time, hiding hours with no bookings. */
function WeekTimeBlocks({
  days,
  bookings,
  todayIso,
  onOpen,
}: {
  days: string[];
  bookings: BookingListItem[];
  todayIso: string;
  onOpen: (booking: BookingListItem) => void;
}) {
  const { slots, byDayAndSlot } = useMemo(() => {
    const grouped: Record<string, Record<string, BookingListItem[]>> = {};
    const used = new Set<string>();

    for (const booking of bookings) {
      const slot = hourSlot(booking.preferred_time);
      used.add(slot);
      const day = (grouped[booking.preferred_date] ??= {});
      (day[slot] ??= []).push(booking);
    }

    for (const day of Object.values(grouped)) {
      for (const list of Object.values(day)) {
        list.sort((a, b) => a.preferred_time.localeCompare(b.preferred_time));
      }
    }

    return {
      slots: [...used].sort(),
      byDayAndSlot: grouped,
    };
  }, [bookings]);

  const columns = "grid grid-cols-[5rem_repeat(7,minmax(0,1fr))] gap-2";

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[62rem]">
        <div
          className={cn(columns, "rounded-meridian bg-meridian-surface-muted p-2")}
        >
          <span className="flex items-center px-2 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
            Time
          </span>
          {days.map((day) => {
            const isToday = day === todayIso;
            return (
              <span
                key={day}
                className={cn(
                  "rounded-meridian-sm px-3 py-1.5 text-center",
                  isToday
                    ? "bg-[color-mix(in_srgb,#82c0cc_28%,white)]"
                    : "bg-meridian-surface",
                )}
              >
                <span className="block text-[10px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                  {weekdayLabel(day)}
                </span>
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isToday ? "text-meridian-teal" : "text-meridian-text",
                  )}
                >
                  {Number(day.slice(8))}
                </span>
              </span>
            );
          })}
        </div>

        {slots.length === 0 ? (
          <p className="mt-2 rounded-meridian-sm bg-meridian-surface-muted px-4 py-10 text-center text-sm text-meridian-text-muted">
            No confirmed bookings this week.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {slots.map((slot) => (
              <div key={slot} className={cn(columns, "items-stretch")}>
                <span className="flex items-center justify-center rounded-meridian-sm bg-meridian-surface-muted px-3 py-3 text-xs font-semibold tabular-nums text-meridian-text-muted">
                  {slot}
                </span>
                {days.map((day) => {
                  const cards = byDayAndSlot[day]?.[slot] ?? [];
                  return (
                    <div
                      key={`${day}-${slot}`}
                      className="flex min-h-[4.25rem] flex-col gap-1.5 rounded-meridian-sm p-1"
                      style={TRACK_TEXTURE}
                    >
                      {cards.map((booking) => (
                        <div key={booking.id} className="h-[3.25rem]">
                          <TimelineCard booking={booking} onOpen={onOpen} dense />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Day view: table rows on a timeline, each card spanning its duration. */
function DayTableGrid({
  date,
  bookings,
  onOpen,
}: {
  date: string;
  bookings: BookingListItem[];
  onOpen: (booking: BookingListItem) => void;
}) {
  const dayBookings = useMemo(
    () => bookings.filter((booking) => booking.preferred_date === date),
    [bookings, date],
  );

  const { onSchedule, beforeOpening } = useMemo(() => {
    const opening = DAY_VIEW_START_HOUR * 60;
    return {
      onSchedule: dayBookings.filter(
        (booking) => startMinutes(booking) >= opening,
      ),
      beforeOpening: dayBookings.filter(
        (booking) => startMinutes(booking) < opening,
      ),
    };
  }, [dayBookings]);

  const { startHour, hours, totalMinutes } = useMemo(() => {
    const start = DAY_VIEW_START_HOUR;
    let end = DAY_VIEW_END_HOUR;
    for (const booking of onSchedule) {
      const finish = startMinutes(booking) + durationMinutes(booking);
      end = Math.max(end, Math.min(Math.ceil(finish / 60), 24));
    }
    return {
      startHour: start,
      hours: Array.from({ length: end - start }, (_, i) => start + i),
      totalMinutes: (end - start) * 60,
    };
  }, [onSchedule]);

  const tables = useMemo(() => {
    const found = new Set(dayBookings.map(tableFor));
    const extras = [...found].filter((name) => !DEFAULT_TABLES.includes(name));
    return [...DEFAULT_TABLES, ...extras.sort()];
  }, [dayBookings]);

  const byTable = useMemo(() => {
    const grouped: Record<string, BookingListItem[]> = {};
    for (const booking of onSchedule) {
      (grouped[tableFor(booking)] ??= []).push(booking);
    }
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => a.preferred_time.localeCompare(b.preferred_time));
    }
    return grouped;
  }, [onSchedule]);

  const trackColumns = {
    gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[60rem]">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 rounded-meridian bg-meridian-surface-muted p-2">
          <span className="flex items-center px-2 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
            Tables
          </span>
          <div className="grid gap-2" style={trackColumns}>
            {hours.map((hour) => (
              <span
                key={hour}
                className="rounded-meridian-sm bg-meridian-surface px-3 py-1.5 text-center text-xs font-semibold tabular-nums text-meridian-text-muted"
              >
                {hourLabel(hour)}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {tables.map((table) => (
            <div
              key={table}
              className="grid grid-cols-[7rem_minmax(0,1fr)] items-stretch gap-2"
            >
              <span className="flex items-center gap-2 rounded-meridian-sm bg-meridian-surface-muted px-3 py-3 text-sm font-semibold text-meridian-text">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-meridian-sm bg-meridian-surface">
                  <ForkKnife
                    className="size-3.5 text-meridian-text-muted"
                    weight="regular"
                    aria-hidden
                  />
                </span>
                <span className="truncate">{table}</span>
              </span>

              <div
                className="relative min-h-[4.25rem] rounded-meridian-sm"
                style={TRACK_TEXTURE}
              >
                {(byTable[table] ?? []).map((booking) => {
                  const from = startMinutes(booking) - startHour * 60;
                  const span = durationMinutes(booking);
                  const left = (from / totalMinutes) * 100;
                  const width = Math.min(
                    (span / totalMinutes) * 100,
                    100 - left,
                  );
                  return (
                    <div
                      key={booking.id}
                      className="absolute inset-y-1"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 5)}%`,
                      }}
                    >
                      <TimelineCard booking={booking} onOpen={onOpen} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {beforeOpening.length > 0 ? (
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-stretch gap-2">
              <span className="flex items-center rounded-meridian-sm bg-meridian-surface-muted px-3 py-3 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                Before opening
              </span>
              <div className="flex flex-wrap gap-2">
                {beforeOpening.map((booking) => (
                  <div key={booking.id} className="h-[3.75rem] w-56">
                    <TimelineCard booking={booking} onOpen={onOpen} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  booking,
  onOpen,
  dense = false,
}: {
  booking: BookingListItem;
  onOpen: (booking: BookingListItem) => void;
  dense?: boolean;
}) {
  const allergy = hasAllergies(booking.allergies);
  const request = hasRequest(booking);
  const from = startMinutes(booking);
  const to = from + durationMinutes(booking);

  return (
    <button
      type="button"
      onClick={() => onOpen(booking)}
      title={allergy ? "Allergies recorded" : request ? "Request added" : undefined}
      className={cn(
        "relative flex h-full w-full cursor-pointer items-center overflow-hidden rounded-meridian-sm text-left shadow-[0_1px_4px_rgba(20,58,68,0.12)] transition-colors",
        allergy
          ? "bg-[color-mix(in_srgb,#e11d48_8%,white)] hover:bg-[color-mix(in_srgb,#e11d48_13%,white)]"
          : request
            ? "bg-[color-mix(in_srgb,var(--meridian-accent)_16%,white)] hover:bg-[color-mix(in_srgb,var(--meridian-accent)_24%,white)]"
            : "bg-meridian-surface hover:bg-meridian-surface-subtle",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          allergy
            ? "bg-[#e11d48]"
            : request
              ? "bg-meridian-accent"
              : "bg-meridian-blue",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 py-2 pr-2.5 pl-3">
        <span className="block truncate text-sm font-medium text-meridian-text">
          {booking.customer_name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-meridian-text-muted">
          <Users className="size-3 shrink-0" weight="regular" aria-hidden />
          <span className="truncate">
            {dense ? (booking.guest_count ?? "—") : guestsLabel(booking.guest_count)}
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {dense
              ? minutesLabel(from)
              : `${minutesLabel(from)}–${minutesLabel(to)}`}
          </span>
        </span>
      </span>
    </button>
  );
}
