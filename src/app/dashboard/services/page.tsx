import { Card, EmptyState } from "@/components/ui";
import { getAppointmentsDashboardMetrics } from "@/lib/dashboard/appointments-analytics";
import { requireAppointmentsContext } from "@/lib/dashboard/require-appointments";

export default async function ServicesPage() {
  const context = await requireAppointmentsContext("services");
  const { data, error } = await getAppointmentsDashboardMetrics(
    context.business.id,
  );

  return (
    <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8 lg:py-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-meridian-text">
          Services
        </h2>
        <p className="max-w-2xl text-meridian-text-muted">
          Appointment services and durations for {context.business.name}.
        </p>
      </header>

      <Card title="Service catalogue">
        {error || !data ? (
          <EmptyState
            title="Could not load services"
            description={error ?? "Try again shortly."}
          />
        ) : data.services.length === 0 ? (
          <EmptyState
            title="No services configured"
            description="Ask a Meridian admin to add services for this business."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {data.services.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-meridian-text">{service.name}</p>
                  <p className="text-xs text-meridian-text-muted">
                    Duration {service.duration_minutes} minutes
                  </p>
                </div>
                <span
                  className={
                    service.is_active
                      ? "text-xs font-semibold text-meridian-teal"
                      : "text-xs font-semibold text-meridian-text-muted"
                  }
                >
                  {service.is_active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Busiest services" description="Last 30 days">
        {!data || data.busiestServices.length === 0 ? (
          <EmptyState
            title="No service demand yet"
            description="Demand appears from confirmed and requested appointments."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {data.busiestServices.map((service) => (
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
    </main>
  );
}
