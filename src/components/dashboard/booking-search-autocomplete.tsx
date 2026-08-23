"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  searchBookingsAutocomplete,
  type BookingSearchHit,
} from "@/lib/dashboard/booking-search";

export type BookingSearchAutocompleteProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  inputClassName?: string;
  /** When a suggestion is chosen. Defaults to navigating to the booking detail page. */
  onSelectHit?: (hit: BookingSearchHit) => void;
  showIcon?: boolean;
};

function formatHitTime(hit: BookingSearchHit): string {
  return `${hit.preferred_date} · ${hit.preferred_time.slice(0, 5)}`;
}

export function BookingSearchAutocomplete({
  name = "q",
  defaultValue = "",
  placeholder = "Search bookings…",
  size = "md",
  className,
  inputClassName,
  onSelectHit,
  showIcon = true,
}: BookingSearchAutocompleteProps) {
  const router = useRouter();
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<BookingSearchHit[]>([]);
  const [pending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const q = value.trim();
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        if (q.length < 1) {
          setHits([]);
          setOpen(false);
          setActiveIndex(-1);
          return;
        }
        const next = await searchBookingsAutocomplete(q);
        setHits(next);
        setOpen(true);
        setActiveIndex(-1);
      });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  const choose = (hit: BookingSearchHit) => {
    setValue(hit.customer_name);
    setOpen(false);
    if (onSelectHit) {
      onSelectHit(hit);
      return;
    }
    router.push(`/dashboard/bookings/${hit.id}`);
  };

  const heightClass = size === "sm" ? "h-9 text-sm" : "h-11 text-sm";
  const showList = open && value.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search bookings
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
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          if (hits.length > 0 && value.trim().length > 0) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!showList || hits.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
              index + 1 >= hits.length ? 0 : index + 1,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) =>
              index <= 0 ? hits.length - 1 : index - 1,
            );
          } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            const hit = hits[activeIndex];
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
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-40 overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface shadow-[0_16px_40px_rgba(20,58,68,0.14)]"
        >
          {pending && hits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-meridian-text-muted">
              Searching…
            </li>
          ) : hits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-meridian-text-muted">
              No bookings found
            </li>
          ) : (
            hits.map((hit, index) => (
              <li key={hit.id} role="option" aria-selected={index === activeIndex}>
                <button
                  id={`${listId}-option-${index}`}
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                    index === activeIndex
                      ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
                      : "hover:bg-meridian-surface-muted",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(hit)}
                >
                  <span className="truncate text-sm font-semibold text-meridian-text">
                    {hit.customer_name}
                  </span>
                  <span className="truncate text-xs text-meridian-text-muted">
                    {formatHitTime(hit)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
