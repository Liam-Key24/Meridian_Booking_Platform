import Link from "next/link";
import { Button } from "@/components/ui";
import type { BookingStatus } from "@/types/database";

const statuses: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Approved" },
  { value: "suggested", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
];

type BookingFiltersProps = {
  status: string;
  from: string;
  to: string;
  action?: string;
};

export function BookingFilters({
  status,
  from,
  to,
  action = "/dashboard/bookings",
}: BookingFiltersProps) {
  return (
    <form
      method="get"
      action={action}
      className="flex flex-col gap-3 rounded-meridian border border-meridian-border bg-meridian-surface p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">Status</span>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-meridian-text"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">From date</span>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-11 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-meridian-text"
        />
      </label>
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">To date</span>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-11 rounded-meridian border border-meridian-border bg-meridian-surface px-3 text-meridian-text"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Link
          href={action}
          className="inline-flex h-9 items-center rounded-meridian border border-meridian-border px-3.5 text-sm font-semibold text-meridian-text"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
