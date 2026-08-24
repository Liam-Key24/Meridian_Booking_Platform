"use client";

import Link from "next/link";
import {
  AdminDataRow,
  AdminDataTable,
  AdminListHeader,
  AdminListPage,
  AdminListToolbar,
  AdminLocalSearch,
  AdminSoftStatus,
  useAdminListFilter,
  useListSearchState,
  type AdminListColumn,
} from "@/components/admin/admin-list";
import type { BookingStatus } from "@/types/database";

export type AdminBookingRow = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_email: string;
  preferred_date: string;
  preferred_time: string;
  status: BookingStatus;
  business_name: string | null;
};

const COLUMNS: AdminListColumn[] = [
  { key: "guest", label: "Guest", track: "minmax(9rem,1.1fr)" },
  { key: "business", label: "Business", track: "minmax(8rem,1fr)" },
  { key: "when", label: "Date", track: "minmax(8rem,0.9fr)" },
  { key: "email", label: "Email", track: "minmax(10rem,1.2fr)" },
  { key: "status", label: "Status", track: "minmax(6rem,0.7fr)" },
  { key: "actions", label: "Actions", track: "minmax(5rem,0.55fr)" },
];

function statusTone(
  status: BookingStatus,
): "success" | "pending" | "danger" | "neutral" {
  if (status === "confirmed") return "success";
  if (status === "pending" || status === "suggested") return "pending";
  if (status === "cancelled" || status === "declined" || status === "no_show") {
    return "danger";
  }
  return "neutral";
}

const selectClass =
  "h-9 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-sm text-meridian-text";

export function AdminBookingsList({
  bookings,
  businesses,
  businessId,
  status,
  q,
  loadError,
}: {
  bookings: AdminBookingRow[];
  businesses: Array<{ id: string; name: string }>;
  businessId: string;
  status: string;
  q: string;
  loadError: boolean;
}) {
  const [query, setQuery] = useListSearchState(q);
  const filtered = useAdminListFilter(
    bookings,
    query,
    (row) =>
      `${row.customer_name} ${row.customer_email} ${row.business_name ?? ""} ${row.status}`,
  );

  return (
    <AdminListPage>
      <AdminListHeader
        title="Bookings list"
        description="Support view across tenants (latest 100). Filter by business or status."
        actions={
          businessId ? (
            <a
              href={`/admin/bookings/export?businessId=${businessId}`}
              className="inline-flex h-10 items-center rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-sm font-semibold text-meridian-text hover:border-meridian-accent"
            >
              Export CSV
            </a>
          ) : null
        }
      />

      <AdminListToolbar
        searchSlot={
          <AdminLocalSearch
            placeholder="Search guest, email, business…"
            value={query}
            onChange={setQuery}
          />
        }
      >
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs font-medium text-meridian-text-muted">
            <span className="block">Business</span>
            <select
              name="businessId"
              defaultValue={businessId}
              className={selectClass}
            >
              <option value="">All businesses</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-meridian-text-muted">
            <span className="block">Status</span>
            <select name="status" defaultValue={status} className={selectClass}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="suggested">Suggested</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-meridian bg-meridian-accent px-4 text-sm font-semibold text-meridian-text-inverse"
          >
            Apply
          </button>
        </form>
      </AdminListToolbar>

      <p className="text-sm text-meridian-text-muted">
        Showing {filtered.length} of {bookings.length}
      </p>

      {loadError ? (
        <p className="text-sm text-meridian-status-declined">
          Could not load bookings.
        </p>
      ) : (
        <AdminDataTable
          columns={COLUMNS}
          rowCount={filtered.length}
          emptyTitle="No bookings found"
          emptyDescription="Try another filter or wait for customer requests."
        >
          {filtered.map((booking) => (
            <AdminDataRow
              key={booking.id}
              columns={COLUMNS}
              cells={[
                <span key="guest" className="font-medium">
                  {booking.customer_name}
                </span>,
                <span key="business" className="text-meridian-text-muted">
                  {booking.business_name ?? "—"}
                </span>,
                <span
                  key="when"
                  className="text-meridian-text-muted tabular-nums"
                >
                  {booking.preferred_date} {booking.preferred_time.slice(0, 5)}
                </span>,
                <span
                  key="email"
                  className="break-all text-meridian-text-muted"
                >
                  {booking.customer_email}
                </span>,
                <AdminSoftStatus
                  key="status"
                  label={booking.status.replace("_", " ")}
                  tone={statusTone(booking.status)}
                />,
                <Link
                  key="actions"
                  href={`/admin/businesses/${booking.business_id}`}
                  className="text-sm font-semibold text-meridian-accent hover:underline"
                >
                  Business
                </Link>,
              ]}
            />
          ))}
        </AdminDataTable>
      )}
    </AdminListPage>
  );
}
