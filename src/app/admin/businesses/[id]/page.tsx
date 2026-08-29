import Link from "next/link";
import { Button, ErrorState } from "@/components/ui";
import {
  MetricCard,
  MetricIconCancelled,
  MetricIconConfirmed,
  MetricIconPending,
  MetricIconUpcoming,
} from "@/components/dashboard/metric-card";
import { getAdminBusinessOpsMetrics } from "@/lib/admin/business-ops";
import {
  BUSINESS_TYPE_LABELS,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/business/modes";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { formatDateTime } from "@/lib/format/datetime";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessType,
  DashboardMode,
  SubscriptionStatus,
} from "@/types/database";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return formatDateTime(value);
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status, business_type, dashboard_mode, subscription_status")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
        <ErrorState
          title="Business not found"
          description="This business id does not exist."
        />
      </main>
    );
  }

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  const subscriptionStatus =
    (business.subscription_status as SubscriptionStatus | undefined) ?? "none";
  const typeLabel = business.business_type
    ? (BUSINESS_TYPE_LABELS[business.business_type as BusinessType] ??
      business.business_type)
    : "Type unset";

  const [{ data: assignment }, { data: metrics }] = await Promise.all([
    supabase
      .from("business_template_assignments")
      .select("template_id")
      .eq("business_id", id)
      .maybeSingle(),
    getAdminBusinessOpsMetrics(id),
  ]);

  const bookingsHref = `/admin/bookings?businessId=${business.id}`;
  const settingsHref = `/admin/businesses/${business.id}/settings/details`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
      <header className="space-y-4">
        <Link
          href="/admin"
          className="text-sm font-semibold text-meridian-accent hover:underline"
        >
          ← Businesses
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
              {business.name}
            </h1>
            <p className="max-w-2xl text-sm text-meridian-text-muted">
              Usage overview — bookings, emails, and last activity. Configure
              the tenant from settings.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-accent uppercase">
                {DASHBOARD_MODE_LABELS[dashboardMode]}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {typeLabel}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {business.status}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {SUBSCRIPTION_STATUS_LABELS[subscriptionStatus]}
              </span>
            </div>
          </div>
          <Link href={settingsHref}>
            <Button type="button">Configure settings</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={settingsHref}
            className="text-meridian-accent hover:underline"
          >
            Settings
          </Link>
          <Link
            href={`/book/${business.slug}`}
            className="text-meridian-accent hover:underline"
          >
            Public book page
          </Link>
          {assignment ? (
            <a
              href={`/preview/${business.slug}`}
              className="text-meridian-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Preview
            </a>
          ) : null}
          <Link
            href={bookingsHref}
            className="text-meridian-accent hover:underline"
          >
            Bookings
          </Link>
          <a
            href={`/admin/bookings/export?businessId=${business.id}`}
            className="text-meridian-accent hover:underline"
          >
            Export CSV
          </a>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-meridian-text sm:text-2xl">
          Live metrics
        </h2>
        {metrics ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Pending"
                value={metrics.pendingVolume}
                href={`${bookingsHref}&status=pending`}
                icon={<MetricIconPending />}
              />
              <MetricCard
                label="Confirmed"
                value={metrics.confirmedVolume}
                href={`${bookingsHref}&status=confirmed`}
                icon={<MetricIconConfirmed />}
              />
              <MetricCard
                label="Bookings"
                value={metrics.bookingVolume}
                href={bookingsHref}
                icon={<MetricIconUpcoming />}
              />
              <MetricCard
                label="Cancelled"
                value={metrics.cancellationVolume}
                href={`${bookingsHref}&status=cancelled`}
                icon={<MetricIconCancelled />}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-meridian border border-meridian-border bg-meridian-surface p-5">
                <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Emails sent
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-meridian-text">
                  {metrics.emailSent}
                </p>
                <p className="mt-1 text-sm text-meridian-text-muted">
                  {metrics.emailFailed} failed · {metrics.emailTotal} recent
                  samples · {metrics.noShowVolume} no-shows
                </p>
              </div>
              <div className="rounded-meridian border border-meridian-border bg-meridian-surface p-5">
                <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Last activity
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-meridian-text">
                  {formatWhen(metrics.lastActivityAt)}
                </p>
                <p className="mt-1 text-sm text-meridian-text-muted">
                  Booking {formatWhen(metrics.lastBookingAt)} · Email{" "}
                  {formatWhen(metrics.lastEmailAt)} · Audit{" "}
                  {formatWhen(metrics.lastAuditAt)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-meridian-status-declined">
            Could not load operational metrics.
          </p>
        )}
      </section>
    </main>
  );
}
