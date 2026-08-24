import Link from "next/link";
import {
  Card,
  EmptyState,
  ErrorState,
  StatusLabel,
} from "@/components/ui";
import {
  RequestsByDayChart,
  StatusDistributionChart,
} from "@/components/dashboard/charts";
import {
  MetricCard,
  MetricIconCancelled,
  MetricIconConfirmed,
  MetricIconPending,
  MetricIconUpcoming,
} from "@/components/dashboard/metric-card";
import { getDashboardMetrics } from "@/lib/dashboard/analytics";
import {
  formatWeekLabel,
  resolveWeekRange,
} from "@/lib/dashboard/analytics-math";
import { requireDashboardContext } from "@/lib/dashboard/require-context";
import { chartBookingNoun } from "@/lib/business/capabilities";
import type { DashboardMode } from "@/types/database";

type PageProps = {
  searchParams: Promise<{ week?: string; period?: string }>;
};

export default async function DashboardHomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const week = resolveWeekRange(params.week);
  const { data: metrics, error } = await getDashboardMetrics(
    context.business.id,
    { weekStart: week.from, requestsPeriod: params.period },
  );

  if (error || !metrics) {
    return (
      <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
        <ErrorState
          title="Could not load dashboard"
          description={error ?? "Unknown error"}
        />
      </main>
    );
  }

  const weekLabel = formatWeekLabel(week.from, week.to);
  const rangeLabel = weekLabel;
  const mode =
    (context.business.dashboard_mode as DashboardMode | undefined) ??
    "hospitality";
  const nouns = chartBookingNoun(mode);
  const yAxisLabel = mode === "hospitality" ? "Tables" : "Bookings";
  const requestsTitle =
    mode === "hospitality"
      ? "Table requests by day"
      : "Booking requests by day";
  const recentTitle =
    mode === "hospitality"
      ? "Recent table requests"
      : "Recent booking requests";

  return (
    <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8 lg:py-10">
      {metrics.warnings.length > 0 ? (
        <Card title="Configuration warnings">
          <ul className="list-disc space-y-1 pl-5 text-sm text-meridian-status-pending">
            {metrics.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-block text-sm font-semibold text-meridian-accent hover:underline"
          >
            Open settings
          </Link>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-meridian-text sm:text-2xl">
            Live metrics
          </h2>
          <div className="flex items-center gap-2 rounded-meridian border border-meridian-border bg-meridian-surface px-2 py-1.5">
            <Link
              href={`/dashboard?week=${week.prevWeekStart}${params.period ? `&period=${params.period}` : ""}`}
              className="inline-flex size-8 items-center justify-center rounded-meridian-sm text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
              aria-label="Previous week"
            >
              ‹
            </Link>
            <p className="min-w-[11rem] text-center text-sm font-semibold text-meridian-text tabular-nums">
              {weekLabel}
            </p>
            <Link
              href={`/dashboard?week=${week.nextWeekStart}${params.period ? `&period=${params.period}` : ""}`}
              className="inline-flex size-8 items-center justify-center rounded-meridian-sm text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
              aria-label="Next week"
            >
              ›
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Pending requests"
            value={metrics.pendingCount}
            href="/dashboard/bookings?status=pending"
            icon={<MetricIconPending />}
          />
          <MetricCard
            label="Confirmed today"
            value={metrics.confirmedToday}
            href="/dashboard/calendar?view=day"
            icon={<MetricIconConfirmed />}
          />
          <MetricCard
            label="Upcoming"
            value={metrics.upcomingConfirmed7d}
            href="/dashboard/calendar?view=week"
            icon={<MetricIconUpcoming />}
          />
          <MetricCard
            label="Cancelled"
            value={metrics.cancelledInRange}
            href="/dashboard/bookings?status=cancelled"
            icon={<MetricIconCancelled />}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StatusDistributionChart
          data={metrics.statusDistribution}
          rangeLabel={rangeLabel}
        />
        <RequestsByDayChart
          data={metrics.requestsByPeriod}
          rangeLabel={metrics.requestsPeriodLabel}
          period={metrics.requestsPeriod}
          week={week.from}
          title={requestsTitle}
          yAxisLabel={yAxisLabel}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title={recentTitle} description={`Newest pending ${nouns.requestPlural}`}>
          {metrics.recentPending.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="New public requests will appear here."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.recentPending.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/bookings?open=${encodeURIComponent(booking.id)}&period=custom`}
                      className="cursor-pointer font-medium text-meridian-text hover:text-meridian-accent"
                    >
                      {booking.customer_name}
                    </Link>
                    <p className="text-xs text-meridian-text-muted">
                      {booking.service_name ?? "Service"} ·{" "}
                      {booking.preferred_date}{" "}
                      {booking.preferred_time.slice(0, 5)}
                    </p>
                  </div>
                  <StatusLabel status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming confirmed" description="Next seven days">
          {metrics.upcomingConfirmed.length === 0 ? (
            <EmptyState
              title="Nothing confirmed soon"
              description="Approved bookings will show here."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.upcomingConfirmed.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/bookings?open=${encodeURIComponent(booking.id)}&period=custom`}
                      className="cursor-pointer font-medium text-meridian-text hover:text-meridian-accent"
                    >
                      {booking.customer_name}
                    </Link>
                    <p className="text-xs text-meridian-text-muted">
                      {booking.service_name ?? "Service"} ·{" "}
                      {booking.preferred_date}{" "}
                      {booking.preferred_time.slice(0, 5)}
                    </p>
                  </div>
                  <StatusLabel status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}
