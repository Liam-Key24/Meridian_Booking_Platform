import { RequiredMark } from "@/components/ui/required-mark";
import { cn } from "@/lib/cn";
import {
  CLIENT_SURFACE_ERROR,
  CLIENT_SURFACE_FIELD,
  CLIENT_SURFACE_FIELD_ERROR,
  CLIENT_SURFACE_HINT,
  CLIENT_SURFACE_LABEL,
  type SurfaceTheme,
} from "@/lib/templates/client-surface-theme";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  surface?: SurfaceTheme;
};

export function Textarea({
  className,
  label,
  hint,
  error,
  id,
  rows = 4,
  surface = "meridian",
  required,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;
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
          {required ? <RequiredMark surface={surface} /> : null}
        </span>
      ) : null}
      <textarea
        id={textareaId}
        required={required}
        rows={rows}
        className={cn(
          isClient
            ? cn("w-full resize-y px-4 py-3", CLIENT_SURFACE_FIELD)
            : cn(
                "w-full resize-y rounded-meridian border border-meridian-border bg-meridian-surface px-4 py-3 text-meridian-text",
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
          error
            ? `${textareaId}-error`
            : hint
              ? `${textareaId}-hint`
              : undefined
        }
        {...props}
      />
      {error ? (
        <span
          id={`${textareaId}-error`}
          className={isClient ? CLIENT_SURFACE_ERROR : "text-meridian-status-declined"}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={`${textareaId}-hint`}
          className={isClient ? CLIENT_SURFACE_HINT : "text-meridian-text-muted"}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
