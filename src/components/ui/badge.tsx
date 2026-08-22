import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "teal" | "blue" | "accent" | "soft";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-meridian-surface-subtle text-meridian-text-muted",
  teal: "bg-[#e8f4f7] text-meridian-teal",
  blue: "bg-[#eaf5f8] text-meridian-blue",
  accent: "bg-[#fff4e5] text-[#9a5b00]",
  soft: "bg-[#eef8fa] text-[#2f6f7c]",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-meridian-sm px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
