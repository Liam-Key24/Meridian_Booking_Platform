import { ErrorState } from "@/components/ui";
import { AppointmentsDashboardHome } from "@/components/dashboard/appointments/appointments-dashboard-home";
import { HospitalityDashboardHome } from "@/components/dashboard/hospitality/hospitality-dashboard-home";
import { getAppointmentsDashboardMetrics } from "@/lib/dashboard/appointments-analytics";
import { getDashboardMetrics } from "@/lib/dashboard/analytics";
import { resolveWeekRange } from "@/lib/dashboard/analytics-math";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

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

  if (context.dashboardMode === "appointments") {
    const { data: metrics, error } = await getAppointmentsDashboardMetrics(
      context.business.id,
      { weekStart: week.from, requestsPeriod: params.period },
    );

    if (error || !metrics) {
      return (
        <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
          <ErrorState
            title="Could not load appointments dashboard"
            description={error ?? "Unknown error"}
          />
        </main>
      );
    }

    return (
      <AppointmentsDashboardHome
        metrics={metrics}
        week={week}
        period={params.period}
      />
    );
  }

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

  return (
    <HospitalityDashboardHome
      metrics={metrics}
      week={week}
      period={params.period}
    />
  );
}
