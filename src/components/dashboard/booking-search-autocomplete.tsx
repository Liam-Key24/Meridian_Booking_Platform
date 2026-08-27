"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  searchBookingsAutocomplete,
  type BookingSearchHit,
} from "@/lib/dashboard/booking-search";
import {
  matchSearchSuggestions,
  type DashboardSearchSuggestion,
} from "@/lib/dashboard/search-suggestions";
import type { DashboardMode } from "@/lib/business/modes";

export type DashboardSearchAutocompleteProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  inputClassName?: string;
  dashboardMode?: DashboardMode;
  /** Capability-filtered nav hrefs used to hide unavailable suggestions. */
  allowedHrefs?: readonly string[];
  onSelectBooking?: (hit: BookingSearchHit) => void;
  /** @deprecated Prefer onSelectBooking */
  onSelectHit?: (hit: BookingSearchHit) => void;
  showIcon?: boolean;
};

type CombinedHit =
  | { kind: "suggestion"; suggestion: DashboardSearchSuggestion }
  | { kind: "booking"; booking: BookingSearchHit };

/** @deprecated Use DashboardSearchAutocomplete */
export type BookingSearchAutocompleteProps = DashboardSearchAutocompleteProps;

function formatHitTime(hit: BookingSearchHit): string {
  const when = `${hit.preferred_date} · ${hit.preferred_time.slice(0, 5)}`;
  return hit.business_name ? `${when} · ${hit.business_name}` : when;
}

export function DashboardSearchAutocomplete({
  name = "q",
  defaultValue = "",
  placeholder = "Search bookings or settings…",
  size = "md",
  className,
  inputClassName,
  dashboardMode = "hospitality",
  allowedHrefs = [],
  onSelectBooking,
  onSelectHit,
  showIcon = true,
}: DashboardSearchAutocompleteProps) {
  const router = useRouter();
  const handleBookingSelect = onSelectBooking ?? onSelectHit;
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [bookingHits, setBookingHits] = useState<BookingSearchHit[]>([]);
  const [pending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(
    () =>
      matchSearchSuggestions({
        query: value,
        mode: dashboardMode,
        allowedHrefs,
        limit: 5,
      }),
    [value, dashboardMode, allowedHrefs],
  );

  const combined: CombinedHit[] = useMemo(() => {
    const rows: CombinedHit[] = suggestions.map((suggestion) => ({
      kind: "suggestion",
      suggestion,
    }));
    for (const booking of bookingHits) {
      rows.push({ kind: "booking", booking });
    }
    return rows;
  }, [suggestions, bookingHits]);

  useEffect(() => {
    const q = value.trim();
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        if (q.length < 1) {
          setBookingHits([]);
          return;
        }
        const next = await searchBookingsAutocomplete(q);
        setBookingHits(next);
      });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  const chooseSuggestion = (suggestion: DashboardSearchSuggestion) => {
    setValue("");
    setOpen(false);
    setFocused(false);
    router.push(suggestion.href);
  };

  const chooseBooking = (hit: BookingSearchHit) => {
    setValue(hit.customer_name);
    setOpen(false);
    setFocused(false);
    if (handleBookingSelect) {
      handleBookingSelect(hit);
      return;
    }
    router.push(
      `/dashboard/bookings?open=${encodeURIComponent(hit.id)}&period=custom`,
    );
  };

  const choose = (hit: CombinedHit) => {
    if (hit.kind === "suggestion") chooseSuggestion(hit.suggestion);
    else chooseBooking(hit.booking);
  };

  const heightClass = size === "sm" ? "h-9 text-sm" : "h-11 text-sm";
  const q = value.trim();
  const showList =
    open &&
    focused &&
    (q.length === 0 ? suggestions.length > 0 : combined.length > 0 || !pending);
  const emptyMessage =
    q.length > 0 && !pending && combined.length === 0
      ? "No bookings or settings found"
      : null;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search bookings or settings
      </label>
      {showIcon ? (
        <span
          className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-meridian-accent"
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 4.9 14.32l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
          </svg>
        </span>
      ) : null}
      <input
        id={inputId}
        name={name}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!showList) return;
          const count = emptyMessage ? 0 : combined.length;
          if (count === 0) {
            if (event.key === "Escape") setOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
              index + 1 >= count ? 0 : index + 1,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) =>
              index <= 0 ? count - 1 : index - 1,
            );
          } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            const hit = combined[activeIndex];
            if (hit) choose(hit);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "w-full rounded-meridian border border-meridian-border bg-meridian-surface text-meridian-text placeholder:text-meridian-text-muted",
          "transition-[border-color,box-shadow] focus-visible:border-meridian-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--meridian-accent)_35%,transparent)] focus-visible:outline-none",
          heightClass,
          showIcon ? "pr-3 pl-9" : "px-3",
          inputClassName,
        )}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-40 max-h-80 overflow-auto rounded-meridian border border-meridian-border bg-meridian-surface shadow-[0_16px_40px_rgba(20,58,68,0.14)]"
        >
          {q.length === 0 ? (
            <li className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
              Suggestions
            </li>
          ) : null}
          {pending && q.length > 0 && combined.length === suggestions.length ? (
            <li className="px-3 py-2 text-xs text-meridian-text-muted">
              Searching bookings…
            </li>
          ) : null}
          {emptyMessage ? (
            <li className="px-3 py-3 text-sm text-meridian-text-muted">
              {emptyMessage}
            </li>
          ) : (
            combined.map((hit, index) => {
              const selected = index === activeIndex;
              if (hit.kind === "suggestion") {
                const { suggestion } = hit;
                return (
                  <li
                    key={`s-${suggestion.id}`}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      id={`${listId}-option-${index}`}
                      type="button"
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
                          : "hover:bg-meridian-surface-muted",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-meridian-text">
                          {suggestion.label}
                        </span>
                        <span className="rounded-meridian-sm bg-meridian-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-meridian-teal uppercase">
                          Page
                        </span>
                      </span>
                      <span className="truncate text-xs text-meridian-text-muted">
                        {suggestion.description}
                      </span>
                    </button>
                  </li>
                );
              }

              const { booking } = hit;
              return (
                <li
                  key={`b-${booking.id}`}
                  role="option"
                  aria-selected={selected}
                >
                  <button
                    id={`${listId}-option-${index}`}
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
                        : "hover:bg-meridian-surface-muted",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => chooseBooking(booking)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-meridian-text">
                        {booking.customer_name}
                      </span>
                      <span className="rounded-meridian-sm bg-meridian-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-meridian-blue uppercase">
                        Booking
                      </span>
                    </span>
                    <span className="truncate text-xs text-meridian-text-muted">
                      {formatHitTime(booking)}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer DashboardSearchAutocomplete */
export function BookingSearchAutocomplete(
  props: DashboardSearchAutocompleteProps,
) {
  return <DashboardSearchAutocomplete {...props} />;
}
