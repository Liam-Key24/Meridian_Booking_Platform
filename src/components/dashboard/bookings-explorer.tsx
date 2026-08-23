"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import {
  AllergyTagStack,
  hasAllergies,
} from "@/components/dashboard/allergy-tags";
import { BookingDetailPanel } from "@/components/dashboard/booking-detail-panel";
import { BookingSearchAutocomplete } from "@/components/dashboard/booking-search-autocomplete";
import { StatusLabel, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BookingListItem } from "@/lib/dashboard/bookings";
import type { BookingStatus } from "@/types/database";

export type BookingsPeriod = "daily" | "weekly" | "monthly" | "custom";

type BookingsExplorerProps = {
  businessId: string;
  bookings: BookingListItem[];
  period: BookingsPeriod;
  status: string;
  from: string;
  to: string;
  q: string;
  error: string | null;
  initialOpenId?: string | null;
};

const statuses: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Approved" },
  { value: "suggested", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
];

const periodOptions: BookingsPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "custom",
];

function StatusChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="m6 8 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function seatsValue(guestCount: number | null): string {
  return guestCount == null ? "—" : String(guestCount);
}

function tableValue(assignedTable: string | null | undefined): string {
  const value = assignedTable?.trim();
  return value ? value : "—";
}

export function BookingsExplorer({
  businessId,
  bookings,
  period,
  status,
  from,
  to,
  q,
  error,
  initialOpenId = null,
}: BookingsExplorerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialOpenId);
  const [openFromUrl, setOpenFromUrl] = useState(initialOpenId);
  const [pendingNav, startTransition] = useTransition();
  const titleId = useId();

  if (initialOpenId !== openFromUrl) {
    setOpenFromUrl(initialOpenId);
    if (initialOpenId) setSelectedId(initialOpenId);
  }

  const selected =
    selectedId == null
      ? null
      : (bookings.find((booking) => booking.id === selectedId) ?? null);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const periodHref = (next: BookingsPeriod) => {
    const params = new URLSearchParams();
    params.set("period", next);
    if (status && status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (next === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    return `/dashboard/bookings?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-meridian-sm border border-meridian-border bg-meridian-surface p-0.5"
          role="group"
          aria-label="Booking date range"
        >
          {periodOptions.map((option) => {
            const active = period === option;
            return (
              <Link
                key={option}
                href={periodHref(option)}
                className={cn(
                  "cursor-pointer rounded-[10px] px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  active
                    ? "bg-meridian-accent text-meridian-text"
                    : "text-meridian-text-muted hover:text-meridian-text",
                )}
                aria-current={active ? "true" : undefined}
              >
                {option}
              </Link>
            );
          })}
        </div>
        <p className="text-sm text-meridian-text-muted">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          {pendingNav ? " · updating…" : ""}
        </p>
      </div>

      <form
        method="get"
        action="/dashboard/bookings"
        className="flex flex-col gap-3 rounded-meridian border border-meridian-border bg-meridian-surface px-3 py-2.5 sm:flex-row sm:items-end sm:justify-between"
        onSubmit={() => startTransition(() => undefined)}
      >
        <input type="hidden" name="period" value={period} />
        <div className="flex w-full max-w-xs flex-col gap-1 text-xs font-medium text-meridian-text-muted sm:max-w-sm">
          <span>Search</span>
          <BookingSearchAutocomplete
            key={q}
            name="q"
            defaultValue={q}
            placeholder="Name or email"
            size="sm"
            showIcon
            className="w-full"
            inputClassName="bg-meridian-surface"
            onSelectHit={(hit) => {
              if (bookings.some((booking) => booking.id === hit.id)) {
                setSelectedId(hit.id);
                return;
              }
              router.push(`/dashboard/bookings?open=${hit.id}&period=custom`);
            }}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:justify-end">
          <label className="relative flex w-full flex-col gap-1 text-xs font-medium text-meridian-text-muted sm:w-[10.5rem]">
            Status
            <span className="relative block">
              <select
                name="status"
                defaultValue={status}
                className="h-9 w-full cursor-pointer appearance-none rounded-meridian-sm border border-meridian-border bg-meridian-surface py-0 pr-9 pl-2.5 text-sm text-meridian-text"
              >
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <StatusChevronIcon className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-meridian-text-muted" />
            </span>
          </label>
          {period === "custom" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-medium text-meridian-text-muted">
                From
                <input
                  name="from"
                  type="date"
                  defaultValue={from}
                  className="h-9 cursor-pointer rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2 text-sm text-meridian-text"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-meridian-text-muted">
                To
                <input
                  name="to"
                  type="date"
                  defaultValue={to}
                  className="h-9 cursor-pointer rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2 text-sm text-meridian-text"
                />
              </label>
            </>
          ) : null}
          <Button type="submit" size="sm">
            Apply
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_minmax(4.5rem,0.9fr)_auto] gap-3 border-b border-meridian-border bg-meridian-surface-muted px-4 py-2.5 pr-5 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase sm:grid-cols-[3.5rem_minmax(0,1.1fr)_minmax(7rem,1.2fr)_5.5rem_6.5rem_1.75rem]">
          <span>Seats</span>
          <span>Name</span>
          <span>Allergy</span>
          <span className="hidden sm:block">Table</span>
          <span className="hidden sm:block">Status</span>
          <span className="sr-only">Open</span>
        </div>
        {error ? (
          <p className="px-4 py-8 text-sm text-meridian-status-declined">
            {error}
          </p>
        ) : bookings.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-meridian-text-muted">
            No bookings match this range.
          </p>
        ) : (
          <ul className="divide-y divide-meridian-border">
            {bookings.map((booking, index) => {
              const active = booking.id === selectedId;
              const allergyAlert = hasAllergies(booking.allergies);
              const zebra = index % 2 === 1;
              return (
                <li key={booking.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(booking.id)}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[3.5rem_minmax(0,1fr)_minmax(4.5rem,0.9fr)_auto] items-center gap-3 px-4 py-3.5 pr-5 text-left transition-colors sm:grid-cols-[3.5rem_minmax(0,1.1fr)_minmax(7rem,1.2fr)_5.5rem_6.5rem_1.75rem]",
                      active
                        ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
                        : allergyAlert
                          ? "bg-[color-mix(in_srgb,#e11d48_4.5%,white)] hover:bg-[color-mix(in_srgb,#e11d48_8%,white)]"
                          : zebra
                            ? "bg-[color-mix(in_srgb,#82C0CC_15%,white)] hover:bg-[color-mix(in_srgb,#82C0CC_22%,white)]"
                            : "bg-white hover:bg-meridian-surface-muted",
                    )}
                  >
                    <span className="text-sm font-semibold text-meridian-text tabular-nums">
                      {seatsValue(booking.guest_count)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-meridian-text">
                        {booking.customer_name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-meridian-text-muted sm:hidden">
                        Table {tableValue(booking.assigned_table)} ·{" "}
                        <StatusLabel status={booking.status} />
                      </span>
                    </span>
                    <AllergyTagStack
                      allergies={booking.allergies}
                      className="min-w-0"
                    />
                    <span className="hidden truncate text-sm text-meridian-text sm:block">
                      {tableValue(booking.assigned_table)}
                    </span>
                    <span className="hidden sm:flex">
                      <StatusLabel status={booking.status} />
                    </span>
                    <ArrowUpRight
                      className="size-4 justify-self-end text-meridian-blue"
                      weight="bold"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
