import Link from "next/link";
import {
  Card,
  EmptyState,
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
import type { AppointmentsDashboardMetrics } from "@/lib/dashboard/appointments-analytics";
import { formatWeekLabel } from "@/lib/dashboard/analytics-math";

type AppointmentsDashboardHomeProps = {
  metrics: AppointmentsDashboardMetrics;
  week: {
    from: string;
    to: string;
    prevWeekStart: string;
    nextWeekStart: string;
  };
  period?: string;
};

export function AppointmentsDashboardHome({
  metrics,
  week,
  period,
}: AppointmentsDashboardHomeProps) {
  const weekLabel = formatWeekLabel(week.from, week.to);
  const periodQuery = period ? `&period=${period}` : "";

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
            Open appointment settings
          </Link>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-meridian-text sm:text-2xl">
              Appointment overview
            </h2>
            <p className="text-sm text-meridian-text-muted">
              Real counts from your booking requests — empty until clients book.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-meridian border border-meridian-border bg-meridian-surface px-2 py-1.5">
            <Link
              href={`/dashboard?week=${week.prevWeekStart}${periodQuery}`}
              className="inline-flex size-8 items-center justify-center rounded-meridian-sm text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
              aria-label="Previous week"
            >
              ‹
            </Link>
            <p className="min-w-[11rem] text-center text-sm font-semibold text-meridian-text tabular-nums">
              {weekLabel}
            </p>
            <Link
              href={`/dashboard?week=${week.nextWeekStart}${periodQuery}`}
              className="inline-flex size-8 items-center justify-center rounded-meridian-sm text-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_14%,white)]"
              aria-label="Next week"
            >
              ›
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Appointments today"
            value={metrics.appointmentsToday}
            href="/dashboard/calendar?view=day"
            icon={<MetricIconConfirmed />}
          />
          <MetricCard
            label="Pending requests"
            value={metrics.pendingRequests}
            href="/dashboard/bookings?status=pending"
            icon={<MetricIconPending />}
          />
          <MetricCard
            label="Confirmed this week"
            value={metrics.confirmedInRange}
            href="/dashboard/bookings?status=confirmed"
            icon={<MetricIconUpcoming />}
          />
          <MetricCard
            label="Cancellations"
            value={metrics.cancelledInRange}
            href="/dashboard/bookings?status=cancelled"
            icon={<MetricIconCancelled />}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card title="No-shows" description={weekLabel}>
            {metrics.noShowsInRange === 0 ? (
              <EmptyState
                title="No no-shows recorded"
                description="Marked no-shows will appear here."
              />
            ) : (
              <p className="text-3xl font-semibold text-meridian-text">
                {metrics.noShowsInRange}
              </p>
            )}
          </Card>
          <Card title="Booking conversion" description="Confirmed ÷ decided">
            {metrics.conversionRate == null ? (
              <EmptyState
                title="Not enough data"
                description="Conversion appears once appointments are confirmed, declined, cancelled, or marked no-show."
              />
            ) : (
              <p className="text-3xl font-semibold text-meridian-text">
                {metrics.conversionRate}%
              </p>
            )}
          </Card>
          <Card title="External booking link">
            {metrics.externalBookingUrl ? (
              <a
                href={metrics.externalBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-semibold text-meridian-accent hover:underline"
              >
                {metrics.externalBookingUrl}
              </a>
            ) : (
              <EmptyState
                title="No external link"
                description="Add an external booking system URL in settings when needed."
              />
            )}
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StatusDistributionChart
          data={metrics.statusDistribution}
          rangeLabel={weekLabel}
        />
        <RequestsByDayChart
          data={metrics.requestsByPeriod}
          rangeLabel={metrics.requestsPeriodLabel}
          period={metrics.requestsPeriod}
          week={week.from}
          title="Appointment requests"
          yAxisLabel="Appointments"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Pending approvals" description="Newest booking requests">
          {metrics.recentPending.length === 0 ? (
            <EmptyState
              title="No pending appointments"
              description="New client requests will appear here."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.recentPending.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/bookings?open=${encodeURIComponent(item.id)}&period=custom`}
                      className="cursor-pointer font-medium text-meridian-text hover:text-meridian-accent"
                    >
                      {item.customer_name}
                    </Link>
                    <p className="text-xs text-meridian-text-muted">
                      {item.service_name ?? "Service"}
                      {item.duration_minutes
                        ? ` · ${item.duration_minutes} min`
                        : ""}{" "}
                      · {item.preferred_date} {item.preferred_time.slice(0, 5)}
                    </p>
                  </div>
                  <StatusLabel status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Confirmed appointments" description="Next seven days">
          {metrics.upcomingConfirmed.length === 0 ? (
            <EmptyState
              title="No confirmed appointments"
              description="Approved appointments will show here."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.upcomingConfirmed.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/bookings?open=${encodeURIComponent(item.id)}&period=custom`}
                      className="cursor-pointer font-medium text-meridian-text hover:text-meridian-accent"
                    >
                      {item.customer_name}
                    </Link>
                    <p className="text-xs text-meridian-text-muted">
                      {item.service_name ?? "Service"}
                      {item.staff_name ? ` · ${item.staff_name}` : ""} ·{" "}
                      {item.preferred_date} {item.preferred_time.slice(0, 5)}
                    </p>
                  </div>
                  <StatusLabel status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Busiest services" description="Last 30 days">
          {metrics.busiestServices.length === 0 ? (
            <EmptyState
              title="No service demand yet"
              description="Service popularity appears from real appointments."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.busiestServices.map((service) => (
                <li
                  key={service.serviceId ?? service.name}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium text-meridian-text">
                    {service.name}
                  </span>
                  <span className="tabular-nums text-meridian-text-muted">
                    {service.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Staff workload" description={weekLabel}>
          {metrics.staffWorkload.length === 0 ? (
            <EmptyState
              title="No staff members"
              description="Add team members in admin, then assign them to appointments."
            />
          ) : (
            <ul className="divide-y divide-meridian-border">
              {metrics.staffWorkload.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-meridian-text">{member.name}</p>
                    <p className="text-xs text-meridian-text-muted capitalize">
                      {member.role}
                    </p>
                  </div>
                  <span className="tabular-nums text-meridian-text-muted">
                    {member.assignedCount} assigned
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}
