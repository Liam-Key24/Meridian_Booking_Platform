import { cn } from "@/lib/cn";
import type { BookingStatus } from "@/types/ui";
import type { HTMLAttributes } from "react";

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement> & {
  status: BookingStatus;
};

const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-meridian-status-pending-bg text-meridian-status-pending",
  },
  confirmed: {
    label: "Approved",
    className:
      "bg-meridian-status-confirmed-bg text-meridian-status-confirmed",
  },
  declined: {
    label: "Declined",
    className:
      "bg-meridian-status-declined-bg text-meridian-status-declined",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-meridian-status-cancelled-bg text-meridian-status-cancelled",
  },
  suggested: {
    label: "Rescheduled",
    className:
      "bg-meridian-status-suggested-bg text-meridian-status-suggested",
  },
  no_show: {
    label: "No-show",
    className:
      "bg-meridian-surface-muted text-meridian-text-muted",
  },
};

export function StatusLabel({
  status,
  className,
  ...props
}: StatusLabelProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-meridian-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-current/20",
        config.className,
        className,
      )}
      {...props}
    >
      {config.label}
    </span>
  );
}
