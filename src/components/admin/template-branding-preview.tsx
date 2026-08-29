import type { TemplateBrandingPreset } from "@/lib/templates/catalog";
import { cn } from "@/lib/cn";

const SWATCH_SIZES = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-11",
} as const;

export function TemplateColorCircles({
  branding,
  size = "sm",
  className,
}: {
  branding: Pick<
    TemplateBrandingPreset,
    "primary" | "accent" | "background" | "text"
  >;
  size?: keyof typeof SWATCH_SIZES;
  className?: string;
}) {
  const colors = [
    branding.primary,
    branding.accent,
    branding.background,
    branding.text,
  ];

  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {colors.map((color) => (
        <span
          key={color}
          title={color}
          className={cn(
            "rounded-full ring-2 ring-meridian-surface",
            SWATCH_SIZES[size],
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function TemplateBrandingPreview({
  branding,
  compact = false,
}: {
  branding: TemplateBrandingPreset;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TemplateColorCircles branding={branding} size={compact ? "sm" : "md"} />
      <span className="text-xs text-meridian-text-muted">
        {branding.headingFontLabel} · {branding.bodyFontLabel}
      </span>
    </div>
  );
}
