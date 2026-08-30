"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function ColorCirclePicker({
  label,
  name,
  defaultValue,
  size = "lg",
}: {
  label: string;
  name: string;
  defaultValue: string;
  size?: "md" | "lg";
}) {
  const [value, setValue] = useState(defaultValue);
  const dimension = size === "lg" ? "size-11" : "size-8";

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <label className="flex flex-col items-center gap-1.5">
      <span className="relative inline-flex">
        <span
          aria-hidden
          className={cn(
            "rounded-full border border-meridian-border shadow-sm",
            dimension,
          )}
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={label}
          className={cn(
            "absolute inset-0 cursor-pointer rounded-full opacity-0",
            dimension,
          )}
        />
      </span>
      <span className="text-[11px] text-meridian-text-muted">{label}</span>
    </label>
  );
}
