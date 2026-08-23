import Link from "next/link";
import { Badge, StatusLabel } from "@/components/ui";
import type { BookingListItem } from "@/lib/dashboard/bookings";

export function BookingList({ bookings }: { bookings: BookingListItem[] }) {
  return (
    <ul className="divide-y divide-meridian-border overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface">
      {bookings.map((booking) => (
        <li key={booking.id}>
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-meridian-surface-muted sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-meridian-text">
                  {booking.customer_name}
                </p>
                <StatusLabel status={booking.status} />
              </div>
              <p className="text-sm text-meridian-text-muted">
                {booking.service?.name ?? "Service removed"} ·{" "}
                {booking.preferred_date} at {booking.preferred_time.slice(0, 5)}
              </p>
              <p className="text-sm text-meridian-text-muted">
                {booking.customer_email}
                {booking.customer_phone ? ` · ${booking.customer_phone}` : ""}
              </p>
            </div>
            <Badge tone="soft">View</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
