import Link from "next/link";
import { Badge, Card, EmptyState, StatusLabel } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

type PageProps = {
  searchParams: Promise<{
    businessId?: string;
    status?: string;
  }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireMeridianAdmin();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .order("name");

  let query = supabase
    .from("bookings")
    .select(
      "id, business_id, customer_name, customer_email, preferred_date, preferred_time, status, created_at, businesses(name, slug)",
    )
    .order("preferred_date", { ascending: false })
    .limit(100);

  if (params.businessId) {
    query = query.eq("business_id", params.businessId);
  }
  if (
    params.status &&
    ["pending", "confirmed", "declined", "cancelled", "suggested"].includes(
      params.status,
    )
  ) {
    query = query.eq("status", params.status as BookingStatus);
  }

  const { data: bookings, error } = await query;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Support</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Bookings across businesses
        </h1>
        <p className="text-meridian-text-muted">
          Meridian-admin support view (latest 100). Filter by business or status.
        </p>
      </header>

      <Card title="Filters">
        <form className="flex flex-wrap gap-3" method="get">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-meridian-text">
              Business
            </span>
            <select
              name="businessId"
              defaultValue={params.businessId ?? ""}
              className="h-11 rounded-meridian border border-meridian-border bg-meridian-surface px-3"
            >
              <option value="">All businesses</option>
              {(businesses ?? []).map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-meridian-text">
              Status
            </span>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-11 rounded-meridian border border-meridian-border bg-meridian-surface px-3"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="suggested">Suggested</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button
            type="submit"
            className="mt-6 inline-flex h-11 items-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse"
          >
            Apply
          </button>
          {params.businessId ? (
            <a
              href={`/admin/bookings/export?businessId=${params.businessId}`}
              className="mt-6 inline-flex h-11 items-center rounded-meridian border border-meridian-border px-5 text-sm font-semibold text-meridian-text"
            >
              Export CSV
            </a>
          ) : null}
        </form>
      </Card>

      <Card title="Results" description={`${bookings?.length ?? 0} row(s)`}>
        {error ? (
          <p className="text-sm text-meridian-status-declined">
            Could not load bookings.
          </p>
        ) : !bookings?.length ? (
          <EmptyState
            title="No bookings found"
            description="Try another filter or wait for customer requests."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {bookings.map((booking) => {
              const business = Array.isArray(booking.businesses)
                ? booking.businesses[0]
                : booking.businesses;
              return (
                <li
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-meridian-text">
                      {booking.customer_name}{" "}
                      <span className="text-meridian-text-muted">
                        · {booking.preferred_date}{" "}
                        {booking.preferred_time.slice(0, 5)}
                      </span>
                    </p>
                    <p className="text-sm text-meridian-text-muted">
                      {business?.name ?? "Unknown business"} ·{" "}
                      {booking.customer_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusLabel status={booking.status} />
                    {business?.slug ? (
                      <Link
                        href={`/admin/businesses/${booking.business_id}`}
                        className="text-sm font-semibold text-meridian-teal hover:underline"
                      >
                        Business
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
