"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  Buildings,
  ClipboardText,
  EnvelopeSimple,
  ListBullets,
  SignOut,
  type Icon,
} from "@phosphor-icons/react";
import { BookingSearchAutocomplete } from "@/components/dashboard/booking-search-autocomplete";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";

type AdminNavItem = {
  href: string;
  label: string;
  icon: Icon;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Businesses", icon: Buildings },
      { href: "/admin/bookings", label: "Bookings", icon: ListBullets },
    ],
  },
  {
    label: "Logs",
    items: [
      { href: "/admin/audit-logs", label: "Audit logs", icon: ClipboardText },
      { href: "/admin/email-logs", label: "Email logs", icon: EnvelopeSimple },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return (
      pathname === "/admin" || pathname.startsWith("/admin/businesses")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitleForPath(pathname: string): string {
  if (pathname.startsWith("/admin/businesses/new")) return "New business";
  if (pathname.startsWith("/admin/businesses/")) return "Business detail";
  if (pathname.startsWith("/admin/bookings")) return "Bookings list";
  if (pathname.startsWith("/admin/audit-logs")) return "Audit logs";
  if (pathname.startsWith("/admin/email-logs")) return "Email logs";
  return "Businesses";
}

export function AdminShell({
  accountEmail,
  children,
}: {
  accountEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
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

  const pageTitle = pageTitleForPath(pathname);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col gap-6 border-r border-meridian-border bg-meridian-surface px-5 py-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-accent text-sm font-bold text-meridian-text-inverse">
          M
        </span>
        <div>
          <p className="text-xs font-semibold tracking-wide text-meridian-accent uppercase">
            Meridian
          </p>
          <p className="text-sm font-semibold text-meridian-text">
            Platform admin
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6" aria-label="Admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-2 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-meridian-sm px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)] text-meridian-text shadow-[inset_3px_0_0_var(--meridian-accent)]"
                          : "text-meridian-text-muted hover:bg-meridian-surface-muted hover:text-meridian-text",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-4 shrink-0" weight="regular" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-meridian-border pt-4">
        <div className="rounded-meridian border border-meridian-border bg-meridian-surface-muted px-3 py-3">
          <p className="truncate text-sm font-semibold text-meridian-text">
            {accountEmail}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-meridian-accent uppercase">
            Meridian admin
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-meridian-sm border border-meridian-border text-sm font-semibold text-meridian-text hover:border-meridian-accent"
          >
            <SignOut className="size-4" weight="regular" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-full flex-1 bg-[color-mix(in_srgb,var(--meridian-surface-muted)_55%,white)]">
      <div className="hidden lg:block">{sidebar}</div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-[#143a44]/40"
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
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-meridian-sm border border-meridian-border text-meridian-text lg:hidden"
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
                  Admin
                </p>
                <h1
                  id={titleId}
                  className="truncate text-lg font-semibold tracking-tight text-meridian-text sm:text-xl"
                >
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div
              className="order-last ml-auto w-full min-w-0 max-w-xl flex-1 basis-full md:order-none md:basis-0"
              role="search"
            >
              <BookingSearchAutocomplete
                name="q"
                placeholder="Search bookings…"
                size="md"
                className="w-full"
                inputClassName="bg-meridian-surface-muted"
                onSelectHit={(hit) => {
                  router.push(
                    `/admin/bookings?q=${encodeURIComponent(hit.customer_name)}`,
                  );
                }}
              />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
