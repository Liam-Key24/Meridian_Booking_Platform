"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingSearchAutocomplete } from "@/components/dashboard/booking-search-autocomplete";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";

export type AdminListColumn = {
  key: string;
  label: string;
  /** CSS grid track size, e.g. minmax(0,1.2fr) */
  track?: string;
  hideOnMobile?: boolean;
};

export function AdminListPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-8 lg:py-10">
      {children}
    </main>
  );
}

export function AdminListHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-meridian-text sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-meridian-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Same visual language as BookingSearchAutocomplete. */
export function AdminLocalSearch({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full">
      <span
        className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-meridian-accent"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 2a8 8 0 1 0 4.9 14.32l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-meridian border border-meridian-border bg-meridian-surface pr-3 pl-9 text-sm text-meridian-text placeholder:text-meridian-text-muted transition-[border-color,box-shadow] focus-visible:border-meridian-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--meridian-accent)_35%,transparent)] focus-visible:outline-none"
        aria-label={placeholder}
      />
    </div>
  );
}

export function AdminListToolbar({
  children,
  searchSlot,
}: {
  children?: React.ReactNode;
  searchSlot: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-meridian border border-meridian-border bg-meridian-surface px-3 py-2.5 lg:flex-row lg:items-end lg:justify-between">
      {children ? (
        <div className="flex flex-wrap items-end gap-2">{children}</div>
      ) : (
        <div />
      )}
      <div className="flex w-full max-w-md flex-col gap-1 text-xs font-medium text-meridian-text-muted lg:ml-auto">
        <span>Search</span>
        {searchSlot}
      </div>
    </div>
  );
}

export function AdminBookingSearchSlot({
  defaultValue = "",
  placeholder = "Search bookings…",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  return (
    <BookingSearchAutocomplete
      name="q"
      defaultValue={defaultValue}
      placeholder={placeholder}
      size="sm"
      showIcon
      className="w-full"
      inputClassName="bg-meridian-surface"
      onSelectHit={(hit) => {
        router.push(
          `/admin/bookings?q=${encodeURIComponent(hit.customer_name)}`,
        );
      }}
    />
  );
}

function tracks(columns: AdminListColumn[]): string {
  return columns.map((column) => column.track ?? "minmax(0,1fr)").join(" ");
}

export function AdminDataTable({
  columns,
  emptyTitle,
  emptyDescription,
  rowCount,
  children,
}: {
  columns: AdminListColumn[];
  emptyTitle: string;
  emptyDescription: string;
  rowCount: number;
  children: React.ReactNode;
}) {
  if (rowCount === 0) {
    return (
      <div className="rounded-meridian border border-meridian-border bg-meridian-surface p-6">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-meridian border border-meridian-border bg-meridian-surface">
      <div className="min-w-[52rem]">
        <div
          className="grid gap-3 border-b border-meridian-border bg-meridian-surface-muted px-4 py-2.5 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase"
          style={{ gridTemplateColumns: tracks(columns) }}
        >
          {columns.map((column) => (
            <span key={column.key}>{column.label}</span>
          ))}
        </div>
        <ul className="divide-y divide-meridian-border">{children}</ul>
      </div>
    </div>
  );
}

export function AdminDataRow({
  columns,
  cells,
}: {
  columns: AdminListColumn[];
  cells: React.ReactNode[];
}) {
  return (
    <li
      className="grid items-center gap-3 px-4 py-3.5 text-sm text-meridian-text"
      style={{ gridTemplateColumns: tracks(columns) }}
    >
      {cells.map((cell, index) => (
        <div key={columns[index]?.key ?? index} className="min-w-0">
          {cell}
        </div>
      ))}
    </li>
  );
}

export function AdminSoftStatus({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "pending" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "bg-meridian-status-confirmed-bg text-meridian-status-confirmed"
      : tone === "pending"
        ? "bg-meridian-status-pending-bg text-meridian-status-pending"
        : tone === "danger"
          ? "bg-meridian-status-declined-bg text-meridian-status-declined"
          : "bg-meridian-surface-muted text-meridian-text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClass,
      )}
    >
      {label}
    </span>
  );
}

export function useAdminListFilter<T>(
  rows: T[],
  query: string,
  getHaystack: (row: T) => string,
): T[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => getHaystack(row).toLowerCase().includes(q));
  }, [rows, query, getHaystack]);
}

export function useListSearchState(initial = "") {
  return useState(initial);
}
