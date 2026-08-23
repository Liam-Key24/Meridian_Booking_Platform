import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
};

export function Select({
  className,
  label,
  hint,
  error,
  id,
  options,
  placeholder,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-meridian-text">{label}</span>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-11 w-full appearance-none rounded-meridian border border-meridian-border bg-meridian-surface py-2 pr-10 pl-4 text-meridian-text",
          "bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%235a7580%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')]",
          "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
          "disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70",
          error && "border-meridian-status-declined",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
        }
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span
          id={`${selectId}-error`}
          className="text-meridian-status-declined"
        >
          {error}
        </span>
      ) : hint ? (
        <span id={`${selectId}-hint`} className="text-meridian-text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
