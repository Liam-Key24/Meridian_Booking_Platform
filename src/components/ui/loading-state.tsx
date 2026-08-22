import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-11 w-11 border-4",
} as const;

export function LoadingState({
  className,
  label = "Loading…",
  size = "md",
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-meridian-text-muted",
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-meridian-soft-blue border-t-meridian-teal",
          sizeClasses[size],
        )}
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
