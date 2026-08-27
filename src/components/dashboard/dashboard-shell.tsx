"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useMemo, useState } from "react";
import {
  CalendarBlank,
  Clock,
  EnvelopeSimple,
  ForkKnife,
  GearSix,
  House,
  Lifebuoy,
  ListBullets,
  Phone,
  PlusCircle,
  Scissors,
  SignOut,
  UserCircle,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/actions";
import {
  switchActiveBusiness,
  type SwitchBusinessState,
} from "@/lib/auth/switch-business";
import { DashboardSearchAutocomplete } from "@/components/dashboard/booking-search-autocomplete";
import {
  HOSPITALITY_NAV,
  pageTitleForPath,
  type DashboardNavDef,
  type DashboardNavKey,
} from "@/components/dashboard/shared/dashboard-nav";
import type { DashboardMode } from "@/lib/business/modes";
import { cn } from "@/lib/cn";

export type DashboardShellProps = {
  businessName: string;
  notificationEmail: string | null;
  contactPhone: string | null;
  openingLabel: string;
  membershipLabel: string;
  publicBookHref: string | null;
  accountName: string;
  accountTitle: string;
  /** Server-resolved mode. Defaults to hospitality so existing UX is unchanged. */
  dashboardMode?: DashboardMode;
  navItems?: DashboardNavDef[];
  /** Memberships available for switching (server-verified list). */
  businesses?: Array<{ id: string; name: string }>;
  activeBusinessId?: string | null;
  children: React.ReactNode;
};

const NAV_ICONS: Record<DashboardNavKey, Icon> = {
  dashboard: House,
  bookings: ListBullets,
  calendar: CalendarBlank,
  new_booking: PlusCircle,
  customers: UsersThree,
  services: Scissors,
  staff: UserCircle,
  availability: Clock,
};

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
  notificationEmail,
  contactPhone,
  openingLabel,
  membershipLabel,
  publicBookHref,
  accountName,
  accountTitle,
  dashboardMode = "hospitality",
  navItems,
  businesses = [],
  activeBusinessId = null,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const nav = navItems ?? HOSPITALITY_NAV;
  const isAppointments = dashboardMode === "appointments";
  const switchInitial: SwitchBusinessState = { status: "idle", message: null };
  const [switchState, switchAction, switchPending] = useActionState(
    switchActiveBusiness,
    switchInitial,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pageTitle = pageTitleForPath(pathname, dashboardMode);
  const ModeIcon = isAppointments ? Scissors : ForkKnife;
  const hoursLabel = isAppointments ? "Availability" : "Opening times";
  const searchPlaceholder = isAppointments
    ? "Search appointments or settings…"
    : "Search bookings or settings…";
  const addLabel = isAppointments ? "Add appointment" : "Add booking";
  const productLabel = isAppointments ? "Appointments" : "Bookings";
  const searchAllowedHrefs = useMemo(
    () => nav.map((item) => item.href),
    [nav],
  );

  const sidebar = (
    <aside className="flex h-full w-72 flex-col gap-5 border-r border-meridian-border bg-meridian-surface px-5 py-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse">
            M
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-meridian-blue uppercase">
              Meridian
            </p>
            <p className="text-sm font-semibold text-meridian-text">
              {productLabel}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-meridian border border-meridian-border bg-meridian-surface-muted px-3 py-3">
          <div className="space-y-1">
            <p className="font-semibold text-meridian-text">{businessName}</p>
            <span className="inline-flex items-center gap-1.5 rounded-meridian-sm bg-meridian-surface px-2 py-1 text-[11px] font-semibold tracking-wide text-meridian-teal uppercase">
              <ModeIcon className="size-3.5" weight="fill" aria-hidden />
              {membershipLabel}
            </span>
          </div>

          {businesses.length > 1 ? (
            <form action={switchAction} className="space-y-1.5">
              <label className="block text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                Active business
                <select
                  name="businessId"
                  defaultValue={activeBusinessId ?? businesses[0]?.id}
                  className="mt-1 h-9 w-full cursor-pointer rounded-meridian-sm border border-meridian-border bg-meridian-surface px-2 text-xs font-medium text-meridian-text"
                  onChange={(event) => {
                    event.currentTarget.form?.requestSubmit();
                  }}
                  disabled={switchPending}
                >
                  {businesses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              {switchState.status === "error" && switchState.message ? (
                <p className="text-xs text-meridian-status-declined" role="alert">
                  {switchState.message}
                </p>
              ) : null}
            </form>
          ) : null}

          <dl className="space-y-2 text-xs text-meridian-text-muted">
            <div className="flex items-start gap-2">
              <EnvelopeSimple
                className="mt-0.5 size-3.5 shrink-0"
                weight="regular"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Email</dt>
                <dd className="break-all text-meridian-text">
                  {notificationEmail?.trim() || "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone
                className="mt-0.5 size-3.5 shrink-0"
                weight="regular"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd className="text-meridian-text">
                  {contactPhone?.trim() || "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock
                className="mt-0.5 size-3.5 shrink-0"
                weight="regular"
                aria-hidden
              />
              <div>
                <dt className="sr-only">{hoursLabel}</dt>
                <dd className="text-meridian-text">{openingLabel}</dd>
              </div>
            </div>
          </dl>

          {publicBookHref ? (
            <Link
              href={publicBookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-meridian bg-meridian-accent px-3 text-xs font-semibold text-meridian-text transition-colors hover:brightness-105"
            >
              View public booking form
            </Link>
          ) : null}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = NAV_ICONS[item.key];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2.5 rounded-meridian-sm px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-meridian-teal text-meridian-text-inverse"
                  : "text-meridian-text-muted hover:bg-meridian-surface-muted hover:text-meridian-text",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" weight="regular" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-meridian-border pt-4">
        <div className="flex items-center gap-3 px-1">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-meridian-surface-muted text-meridian-teal">
            <UserCircle className="size-8" weight="duotone" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-meridian-text">
              {accountName}
            </p>
            <p className="truncate text-xs text-meridian-text-muted">
              {accountTitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-2 rounded-meridian border px-3 text-sm font-semibold transition-colors",
              pathname.startsWith("/dashboard/settings")
                ? "border-meridian-teal bg-meridian-teal text-meridian-text-inverse"
                : "border-meridian-border bg-meridian-surface text-meridian-text hover:border-meridian-accent hover:bg-meridian-surface-muted",
            )}
            aria-current={
              pathname.startsWith("/dashboard/settings") ? "page" : undefined
            }
          >
            <GearSix className="size-4 shrink-0" weight="regular" aria-hidden />
            Settings
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-10 w-full cursor-pointer items-center gap-2 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-sm font-semibold text-meridian-text transition-colors hover:border-meridian-accent hover:bg-meridian-surface-muted"
            >
              <SignOut className="size-4 shrink-0" weight="regular" aria-hidden />
              Sign out
            </button>
          </form>

          <a
            href="mailto:support@meridian.example"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-sm font-semibold text-meridian-text transition-colors hover:border-meridian-accent hover:bg-meridian-surface-muted"
          >
            <Lifebuoy className="size-4 shrink-0" weight="regular" aria-hidden />
            Help and support
          </a>
        </div>
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
              <DashboardSearchAutocomplete
                name="q"
                placeholder={searchPlaceholder}
                size="md"
                className="mx-auto w-full max-w-xl"
                inputClassName="bg-meridian-surface-muted"
                dashboardMode={dashboardMode}
                allowedHrefs={searchAllowedHrefs}
              />
            </form>

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
              {publicBookHref ? (
                <Link
                  href={publicBookHref}
                  className="inline-flex h-11 cursor-pointer items-center rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-sm font-semibold text-meridian-text hover:border-meridian-accent sm:px-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public page
                </Link>
              ) : null}
              <Link
                href="/dashboard/bookings/new"
                className="inline-flex h-11 cursor-pointer items-center rounded-meridian bg-meridian-accent px-3 text-sm font-semibold text-meridian-text hover:brightness-105 sm:px-4"
              >
                {addLabel}
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
