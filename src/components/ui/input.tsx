import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({
  className,
  label,
  hint,
  error,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-meridian-text">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text",
          "placeholder:text-meridian-text-muted/70",
          "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
          "disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70",
          error && "border-meridian-status-declined",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-meridian-status-declined">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-meridian-text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
