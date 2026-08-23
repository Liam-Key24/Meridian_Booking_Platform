import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function ErrorState({
  className,
  title = "Something went wrong",
  description = "Please try again. If the problem continues, contact Meridian support.",
  action,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-meridian border border-meridian-status-declined/25 bg-meridian-status-declined-bg/60 px-6 py-10 text-center",
        className,
      )}
      role="alert"
      {...props}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-meridian-surface text-meridian-status-declined"
        aria-hidden
      >
        <span className="text-xl font-semibold">!</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-meridian-text">{title}</h3>
        {description ? (
          <p className="max-w-sm text-sm text-meridian-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
