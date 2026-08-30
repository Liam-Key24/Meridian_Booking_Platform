import { cn } from "@/lib/cn";
import {
  CLIENT_SURFACE_ERROR,
  CLIENT_SURFACE_FIELD,
  CLIENT_SURFACE_FIELD_ERROR,
  CLIENT_SURFACE_HINT,
  CLIENT_SURFACE_LABEL,
  type SurfaceTheme,
} from "@/lib/templates/client-surface-theme";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  surface?: SurfaceTheme;
};

export function Input({
  className,
  label,
  hint,
  error,
  id,
  surface = "meridian",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const isClient = surface === "client";

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span
          className={cn(
            isClient ? CLIENT_SURFACE_LABEL : "font-medium text-meridian-text",
          )}
        >
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          isClient
            ? cn("h-11 w-full px-4", CLIENT_SURFACE_FIELD)
            : cn(
                "h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text",
                "placeholder:text-meridian-text-muted/70",
                "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
                "disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70",
              ),
          error &&
            (isClient ? CLIENT_SURFACE_FIELD_ERROR : "border-meridian-status-declined"),
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <span
          id={`${inputId}-error`}
          className={isClient ? CLIENT_SURFACE_ERROR : "text-meridian-status-declined"}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={`${inputId}-hint`}
          className={isClient ? CLIENT_SURFACE_HINT : "text-meridian-text-muted"}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
