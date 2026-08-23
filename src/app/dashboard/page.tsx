import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  StatusLabel,
} from "@/components/ui";
import {
  RequestsByDayChart,
  StatusDistributionChart,
  TopServicesChart,
} from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getDashboardMetrics } from "@/lib/dashboard/analytics";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

export default async function DashboardHomePage() {
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

  const { data: metrics, error } = await getDashboardMetrics(
    context.business.id,
    { days: 30 },
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

  const rangeLabel = `${metrics.range.from} → ${metrics.range.to} (${metrics.range.days} days)`;

  return (
    <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="teal">Overview</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-meridian-text">
            {context.business.name}
          </h2>
          <p className="max-w-2xl text-meridian-text-muted">
            Live booking metrics from Supabase under Row Level Security — never
            fabricated.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/book/${context.business.slug}`}
            className="inline-flex h-11 items-center rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-sm font-semibold text-meridian-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            Public page
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex h-11 items-center rounded-meridian bg-meridian-teal px-4 text-sm font-semibold text-meridian-text-inverse"
          >
            New booking
          </Link>
        </div>
      </header>

      {metrics.warnings.length > 0 ? (
        <Card title="Configuration warnings">
          <ul className="list-disc space-y-1 pl-5 text-sm text-meridian-status-pending">
            {metrics.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-block text-sm font-semibold text-meridian-teal hover:underline"
          >
            Open settings
          </Link>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Pending requests"
          value={metrics.pendingCount}
          rangeLabel="Open now"
          href="/dashboard/bookings?status=pending"
          tone="accent"
        />
        <MetricCard
          label="Confirmed today"
          value={metrics.confirmedToday}
          rangeLabel="Preferred date = today"
          href="/dashboard/calendar?view=day"
        />
        <MetricCard
          label="Upcoming (7 days)"
          value={metrics.upcomingConfirmed7d}
          rangeLabel="Confirmed next 7 days"
          href="/dashboard/calendar?view=week"
          tone="blue"
        />
        <MetricCard
          label="Declined / cancelled"
          value={metrics.declinedOrCancelledInRange}
          rangeLabel={rangeLabel}
          href="/dashboard/bookings?status=declined"
          tone="muted"
        />
        <MetricCard
          label="Active services"
          value={metrics.activeServices}
          rangeLabel="Published for requests"
          href="/dashboard/settings"
        />
        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
              Booking mode
            </p>
            <p className="text-xl font-semibold capitalize text-meridian-text">
              {metrics.bookingMode ?? "—"}
            </p>
            <p className="text-xs text-meridian-text-muted">
              {metrics.timezone ?? "Timezone not set"}
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block text-sm font-semibold text-meridian-teal hover:underline"
            >
              Manage mode
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StatusDistributionChart
          data={metrics.statusDistribution}
          rangeLabel={rangeLabel}
        />
        <TopServicesChart data={metrics.topServices} rangeLabel={rangeLabel} />
        <RequestsByDayChart data={metrics.requestsByDay} rangeLabel={rangeLabel} />
        <RequestsByDayChart
          data={metrics.confirmedByDay}
          rangeLabel={rangeLabel}
          title="Confirmed bookings by preferred day"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent booking requests" description="Newest pending items">
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
                      href={`/dashboard/bookings/${booking.id}`}
                      className="font-medium text-meridian-text hover:text-meridian-teal"
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
                      href={`/dashboard/bookings/${booking.id}`}
                      className="font-medium text-meridian-text hover:text-meridian-teal"
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

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/bookings?status=pending"
            className="rounded-meridian bg-meridian-accent px-4 py-2 text-sm font-semibold text-meridian-text"
          >
            Review pending
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-meridian border border-meridian-border px-4 py-2 text-sm font-semibold text-meridian-text"
          >
            Open calendar
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="rounded-meridian border border-meridian-border px-4 py-2 text-sm font-semibold text-meridian-text"
          >
            Add manual booking
          </Link>
        </div>
      </Card>
    </main>
  );
}
