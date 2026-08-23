"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { BookingSearchAutocomplete } from "@/components/dashboard/booking-search-autocomplete";
import { StatusLabel, Button } from "@/components/ui";
import {
  cancelBooking,
  declineBooking,
  type BookingActionState,
} from "@/lib/dashboard/booking-actions";
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
};

const statuses: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "suggested", label: "Suggested" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

const periodOptions: BookingsPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "custom",
];

const initialAction: BookingActionState = { status: "idle", message: null };

const selectChevronClass =
  "appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9 pl-2.5 " +
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%235a7580%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')]";

function seatsValue(guestCount: number | null): string {
  return guestCount == null ? "—" : String(guestCount);
}

function tableValue(assignedTable: string | null | undefined): string {
  const value = assignedTable?.trim();
  return value ? value : "—";
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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
}: BookingsExplorerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingNav, startTransition] = useTransition();
  const titleId = useId();
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
                  "rounded-[10px] px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
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
        className="flex flex-wrap items-end gap-2 rounded-meridian border border-meridian-border bg-meridian-surface px-3 py-2.5"
        onSubmit={() => startTransition(() => undefined)}
      >
        <input type="hidden" name="period" value={period} />
        <label className="flex min-w-[8rem] flex-col gap-1 text-xs font-medium text-meridian-text-muted">
          Status
          <select
            name="status"
            defaultValue={status}
            className={cn(
              "h-9 rounded-meridian-sm border border-meridian-border bg-meridian-surface text-sm text-meridian-text",
              selectChevronClass,
            )}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-meridian-text-muted">
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
              router.push(`/dashboard/bookings/${hit.id}`);
            }}
          />
        </div>
        {period === "custom" ? (
          <>
            <label className="flex flex-col gap-1 text-xs font-medium text-meridian-text-muted">
              From
              <input
                name="from"
                type="date"
                defaultValue={from}
                className="h-9 rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2 text-sm text-meridian-text"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-meridian-text-muted">
              To
              <input
                name="to"
                type="date"
                defaultValue={to}
                className="h-9 rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2 text-sm text-meridian-text"
              />
            </label>
          </>
        ) : null}
        <Button type="submit" size="sm">
          Apply
        </Button>
      </form>

      <div className="overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-3 border-b border-meridian-border bg-meridian-surface-muted px-4 py-2.5 pr-5 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase sm:grid-cols-[3.5rem_minmax(0,1.2fr)_6.5rem_7rem_1.75rem]">
          <span>Seats</span>
          <span>Name</span>
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
            {bookings.map((booking) => {
              const active = booking.id === selectedId;
              return (
                <li key={booking.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(booking.id)}
                    className={cn(
                      "grid w-full grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 pr-5 text-left transition-colors sm:grid-cols-[3.5rem_minmax(0,1.2fr)_6.5rem_7rem_1.75rem]",
                      active
                        ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
                        : "hover:bg-meridian-surface-muted",
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
                    <span className="hidden truncate text-sm text-meridian-text sm:block">
                      {tableValue(booking.assigned_table)}
                    </span>
                    <span className="hidden sm:flex">
                      <StatusLabel status={booking.status} />
                    </span>
                    <span
                      className="justify-self-end text-lg leading-none text-meridian-accent"
                      aria-hidden
                    >
                      ›
                    </span>
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
          onCancelled={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function BookingDetailPanel({
  businessId,
  booking,
  titleId,
  onClose,
  onCancelled,
}: {
  businessId: string;
  booking: BookingListItem;
  titleId: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelBooking,
    initialAction,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBooking,
    initialAction,
  );

  useEffect(() => {
    if (cancelState.status === "success" || declineState.status === "success") {
      onCancelled();
    }
    // Intentionally only react to action results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelState.status, declineState.status]);

  const canCancelConfirmed = booking.status === "confirmed";
  const canCancelPending =
    booking.status === "pending" || booking.status === "suggested";
  const feedback =
    [cancelState, declineState].find((state) => state.status !== "idle") ??
    null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-3 sm:p-5 lg:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-[#143a44]/45 backdrop-blur-[2px]"
        aria-label="Close booking details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface shadow-[0_24px_80px_rgba(20,58,68,0.28)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-meridian-border px-5 py-4">
          <div className="min-w-0 space-y-2">
            <StatusLabel status={booking.status} />
            <h2
              id={titleId}
              className="truncate text-xl font-semibold tracking-tight text-meridian-text"
            >
              {booking.customer_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-meridian-sm border border-meridian-border text-meridian-text-muted hover:bg-meridian-surface-muted hover:text-meridian-text"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <dl className="space-y-4 text-sm">
            <DetailRow label="Seats" value={seatsValue(booking.guest_count)} />
            <DetailRow
              label="Table assigned"
              value={tableValue(booking.assigned_table)}
            />
            <DetailRow label="Email" value={booking.customer_email} />
            <DetailRow
              label="Phone"
              value={booking.customer_phone || "—"}
            />
            <DetailRow
              label="Service"
              value={booking.service?.name ?? "Service removed"}
            />
            <DetailRow
              label="Booking time"
              value={`${booking.preferred_date} at ${booking.preferred_time.slice(0, 5)}`}
            />
            {booking.suggested_date ? (
              <DetailRow
                label="Suggested time"
                value={`${booking.suggested_date} at ${(booking.suggested_time ?? "").slice(0, 5)}`}
              />
            ) : null}
            <DetailRow
              label="Created"
              value={formatWhen(booking.created_at)}
            />
            <DetailRow
              label="Request notes"
              value={booking.notes?.trim() || "—"}
            />
          </dl>

          {feedback ? (
            <p
              className={
                feedback.status === "error"
                  ? "text-sm text-meridian-status-declined"
                  : "text-sm text-meridian-teal"
              }
              role="status"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>

        <footer className="space-y-2 border-t border-meridian-border px-5 py-4">
          {canCancelConfirmed ? (
            <form action={cancelAction}>
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <Button
                type="submit"
                variant="danger"
                fullWidth
                disabled={cancelPending}
              >
                {cancelPending ? "Cancelling…" : "Cancel booking"}
              </Button>
            </form>
          ) : null}
          {canCancelPending ? (
            <form action={declineAction}>
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <Button
                type="submit"
                variant="danger"
                fullWidth
                disabled={declinePending}
              >
                {declinePending ? "Cancelling…" : "Cancel request"}
              </Button>
            </form>
          ) : null}
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Close
          </Button>
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="block text-center text-xs font-semibold text-meridian-accent hover:underline"
          >
            Open full booking page
          </Link>
        </footer>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-meridian-text">{value}</dd>
    </div>
  );
}
