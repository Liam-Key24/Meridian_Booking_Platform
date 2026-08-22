import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  className,
  label,
  hint,
  error,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-meridian-text">{label}</span>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "w-full resize-y rounded-meridian border border-meridian-border bg-meridian-surface px-4 py-3 text-meridian-text",
          "placeholder:text-meridian-text-muted/70",
          "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
          "disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70",
          error && "border-meridian-status-declined",
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
          className="text-meridian-status-declined"
        >
          {error}
        </span>
      ) : hint ? (
        <span id={`${textareaId}-hint`} className="text-meridian-text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
