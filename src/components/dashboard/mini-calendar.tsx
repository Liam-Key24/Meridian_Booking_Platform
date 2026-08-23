"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
} from "@/lib/dashboard/calendar";

export function MiniCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = parseLocalDate(value);
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1, 12),
  );

  const weeks = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
    const startDay = start.getDay();
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    let day = addDays(start, mondayOffset);
    const rows: Date[][] = [];
    for (let week = 0; week < 6; week += 1) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i += 1) {
        row.push(day);
        day = addDays(day, 1);
      }
      rows.push(row);
    }
    return rows;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-meridian border border-meridian-border bg-meridian-surface-muted p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
          aria-label="Previous month"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1, 12),
            )
          }
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-meridian-text">{monthLabel}</p>
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
          aria-label="Next month"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12),
            )
          }
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wide text-meridian-text-muted uppercase">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day) => {
          const iso = formatLocalDate(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isSelected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className={cn(
                "inline-flex aspect-square cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors",
                isSelected
                  ? "bg-meridian-accent text-meridian-text"
                  : inMonth
                    ? "text-meridian-text hover:bg-[color-mix(in_srgb,var(--meridian-accent)_16%,white)]"
                    : "text-meridian-text-muted/50 hover:bg-meridian-surface",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
