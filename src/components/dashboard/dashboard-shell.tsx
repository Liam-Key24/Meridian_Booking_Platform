"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export type DashboardShellProps = {
  businessName: string;
  businessStatus: string;
  bookingMode: string | null;
  publicBookHref: string | null;
  userEmail: string | undefined;
  children: React.ReactNode;
};

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/bookings/new", label: "New booking" },
  { href: "/dashboard/settings", label: "Settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/bookings/new") {
    return pathname.startsWith("/dashboard/bookings/new");
  }
  if (href === "/dashboard/bookings") {
    return (
      pathname === "/dashboard/bookings" ||
      (/^\/dashboard\/bookings\/[^/]+$/.test(pathname) &&
        !pathname.startsWith("/dashboard/bookings/new"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  businessName,
  businessStatus,
  bookingMode,
  publicBookHref,
  userEmail,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const searchId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pageTitle = (() => {
    if (pathname.startsWith("/dashboard/calendar")) return "Calendar";
    if (pathname.startsWith("/dashboard/bookings/new")) return "New booking";
    if (pathname.startsWith("/dashboard/bookings/")) return "Booking detail";
    if (pathname.startsWith("/dashboard/bookings")) return "Bookings";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    return "Dashboard";
  })();

  const sidebar = (
    <aside className="flex h-full w-72 flex-col gap-6 border-r border-meridian-border bg-meridian-surface px-5 py-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse">
            M
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-meridian-blue uppercase">
              Meridian
            </p>
            <p className="text-sm font-semibold text-meridian-text">Bookings</p>
          </div>
        </div>
        <div className="rounded-meridian border border-meridian-border bg-meridian-surface-muted px-3 py-3">
          <p className="font-semibold text-meridian-text">{businessName}</p>
          <p className="mt-1 text-xs text-meridian-text-muted capitalize">
            {businessStatus}
            {bookingMode ? ` · ${bookingMode}` : ""}
          </p>
          {publicBookHref ? (
            <Link
              href={publicBookHref}
              className="mt-2 inline-block text-xs font-semibold text-meridian-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Public booking page
            </Link>
          ) : null}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-meridian-sm px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-meridian-teal text-meridian-text-inverse"
                  : "text-meridian-text-muted hover:bg-meridian-surface-muted hover:text-meridian-text",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-meridian-border pt-4">
        <a
          href="mailto:support@meridian.example"
          className="block rounded-meridian-sm px-3 py-2 text-sm font-medium text-meridian-text-muted hover:bg-meridian-surface-muted hover:text-meridian-text"
        >
          Help / support
        </a>
        <p className="px-3 text-xs text-meridian-text-muted">{userEmail}</p>
        <form action={signOut}>
          <Button type="submit" variant="secondary" size="sm" fullWidth>
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-full flex-1 bg-meridian-surface-muted">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
        {sidebar}
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#143a44]/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 shadow-xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-meridian-border bg-meridian-surface/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-[var(--meridian-space-page)] py-3 lg:gap-4 lg:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-meridian-sm border border-meridian-border text-meridian-text lg:hidden"
                aria-expanded={open}
                aria-controls={titleId}
                onClick={() => setOpen((value) => !value)}
              >
                <span className="sr-only">Open menu</span>
                <span aria-hidden className="text-lg font-bold">
                  ≡
                </span>
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold tracking-wide text-meridian-accent uppercase">
                  {businessName}
                </p>
                <h1
                  id={titleId}
                  className="truncate text-lg font-semibold tracking-tight text-meridian-text sm:text-xl"
                >
                  {pageTitle}
                </h1>
              </div>
            </div>

            <form
              method="get"
              action="/dashboard/bookings"
              className="order-last w-full min-w-0 flex-1 basis-full md:order-none md:basis-0"
              role="search"
            >
              <label htmlFor={searchId} className="sr-only">
                Search bookings
              </label>
              <div className="relative mx-auto w-full max-w-xl">
                <span
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-meridian-accent"
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 2a8 8 0 1 0 4.9 14.32l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
                  </svg>
                </span>
                <input
                  id={searchId}
                  name="q"
                  type="search"
                  placeholder="Search bookings…"
                  className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface-muted py-2 pr-3 pl-10 text-sm text-meridian-text placeholder:text-meridian-text-muted transition-[border-color,box-shadow] focus-visible:border-meridian-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--meridian-accent)_35%,transparent)] focus-visible:outline-none"
                />
              </div>
            </form>

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
              {publicBookHref ? (
                <Link
                  href={publicBookHref}
                  className="inline-flex h-11 items-center rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-sm font-semibold text-meridian-text hover:border-meridian-accent sm:px-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public page
                </Link>
              ) : null}
              <Link
                href="/dashboard/bookings/new"
                className="inline-flex h-11 items-center rounded-meridian bg-meridian-accent px-3 text-sm font-semibold text-meridian-text hover:brightness-105 sm:px-4"
              >
                Add booking
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
