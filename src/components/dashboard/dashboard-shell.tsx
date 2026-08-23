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
              className="mt-2 inline-block text-xs font-semibold text-meridian-teal hover:underline"
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
          <div className="flex items-center justify-between gap-4 px-[var(--meridian-space-page)] py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-meridian-sm border border-meridian-border text-meridian-text lg:hidden"
                aria-expanded={open}
                aria-controls={titleId}
                onClick={() => setOpen((value) => !value)}
              >
                <span className="sr-only">Open menu</span>
                <span aria-hidden className="text-lg font-bold">
                  ≡
                </span>
              </button>
              <div>
                <p className="text-xs font-semibold tracking-wide text-meridian-blue uppercase">
                  {businessName}
                </p>
                <h1
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-meridian-text sm:text-xl"
                >
                  {pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/bookings"
                className="hidden rounded-meridian-sm border border-meridian-border px-3 py-2 text-sm font-medium text-meridian-text-muted hover:bg-meridian-surface-muted sm:inline-flex"
              >
                Search bookings
              </Link>
              <form action={signOut} className="hidden sm:block">
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
