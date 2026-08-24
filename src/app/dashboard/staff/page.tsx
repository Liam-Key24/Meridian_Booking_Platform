import { Card, EmptyState } from "@/components/ui";
import { getAppointmentsDashboardMetrics } from "@/lib/dashboard/appointments-analytics";
import { requireAppointmentsContext } from "@/lib/dashboard/require-appointments";

export default async function StaffPage() {
  const context = await requireAppointmentsContext();
  const { data, error } = await getAppointmentsDashboardMetrics(
    context.business.id,
  );

  return (
    <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8 lg:py-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-meridian-text">
          Staff
        </h2>
        <p className="max-w-2xl text-meridian-text-muted">
          Team members for {context.business.name} and assigned appointment
          workload this week.
        </p>
      </header>

      <Card title="Assigned staff">
        {error || !data ? (
          <EmptyState
            title="Could not load staff"
            description={error ?? "Try again shortly."}
          />
        ) : data.staffWorkload.length === 0 ? (
          <EmptyState
            title="No staff members"
            description="Add owners or staff via Meridian admin, then assign them to appointments."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {data.staffWorkload.map((member) => (
              <li
                key={member.userId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-meridian-text">{member.name}</p>
                  <p className="text-xs text-meridian-text-muted capitalize">
                    {member.role}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-meridian-text-muted">
                  {member.assignedCount} confirmed assigned
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
