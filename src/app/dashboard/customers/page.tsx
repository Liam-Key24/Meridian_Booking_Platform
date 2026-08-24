import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { getAppointmentsDashboardMetrics } from "@/lib/dashboard/appointments-analytics";
import { requireAppointmentsContext } from "@/lib/dashboard/require-appointments";

export default async function CustomersPage() {
  const context = await requireAppointmentsContext();
  const { data, error } = await getAppointmentsDashboardMetrics(
    context.business.id,
  );

  return (
    <main className="flex flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8 lg:py-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-meridian-text">
          Customers
        </h2>
        <p className="max-w-2xl text-meridian-text-muted">
          Clients who have requested or held appointments at{" "}
          {context.business.name}. Built from real booking records.
        </p>
      </header>

      <Card title="Customer list">
        {error || !data ? (
          <EmptyState
            title="Could not load customers"
            description={error ?? "Try again shortly."}
          />
        ) : data.customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Customers appear after appointment requests are submitted."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {data.customers.map((customer) => (
              <li
                key={customer.email}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-meridian-text">{customer.name}</p>
                  <p className="text-xs text-meridian-text-muted">
                    {customer.email}
                  </p>
                </div>
                <div className="text-right text-sm text-meridian-text-muted">
                  <p className="tabular-nums">
                    {customer.appointmentCount} appointment
                    {customer.appointmentCount === 1 ? "" : "s"}
                  </p>
                  {customer.lastPreferredDate ? (
                    <p className="text-xs">Last {customer.lastPreferredDate}</p>
                  ) : null}
                  <Link
                    href={`/dashboard/bookings?q=${encodeURIComponent(customer.email)}`}
                    className="text-xs font-semibold text-meridian-accent hover:underline"
                  >
                    View bookings
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
