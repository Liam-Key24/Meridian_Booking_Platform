import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({
  className,
  title,
  description,
  action,
  icon,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-meridian border border-dashed border-meridian-border bg-meridian-surface-subtle/60 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="text-meridian-soft-blue" aria-hidden>
          {icon}
        </div>
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-meridian-surface text-meridian-blue"
          aria-hidden
        >
          <span className="text-xl">◇</span>
        </div>
      )}
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
