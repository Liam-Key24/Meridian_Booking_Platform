import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
};

export function MetricCard({ label, value, href, icon }: MetricCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full items-stretch gap-4 rounded-meridian border border-meridian-border bg-meridian-surface p-5",
        "transition-[border-color,box-shadow,transform] hover:border-[color-mix(in_srgb,var(--meridian-accent)_55%,var(--meridian-border))] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--meridian-accent)_12%,transparent)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--meridian-focus-ring)]",
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-meridian-sm bg-[color-mix(in_srgb,var(--meridian-accent)_18%,white)] text-meridian-accent"
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
          {label}
        </span>
        <span className="text-3xl font-semibold tracking-tight text-meridian-text">
          {value}
        </span>
      </span>
      <span
        className="flex items-center self-center text-meridian-accent transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M7.5 4.5 13 10l-5.5 5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

export function MetricIconPending() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm.75-12.5h-1.5v5.25l4.5 2.7.75-1.23-3.75-2.22Z" />
    </svg>
  );
}

export function MetricIconConfirmed() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14Zm0-12H5V6h14Zm-9.5 8.5 1.4 1.4 4.2-4.2-1.4-1.4-2.8 2.8-1-1Z" />
    </svg>
  );
}

export function MetricIconUpcoming() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14Zm0-12H5V6h14ZM7 13h4v4H7Z" />
    </svg>
  );
}

export function MetricIconCancelled() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm3.54-11.54-1.41-1.41L12 10.59 9.87 8.46 8.46 9.87 10.59 12l-2.13 2.13 1.41 1.41L12 13.41l2.13 2.13 1.41-1.41L13.41 12l2.13-2.13Z" />
    </svg>
  );
}
