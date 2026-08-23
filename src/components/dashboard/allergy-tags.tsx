"use client";

import {
  Acorn,
  CirclesFour,
  CirclesThree,
  CoffeeBean,
  Cow,
  Egg,
  FishSimple,
  Flask,
  FlowerLotus,
  Grains,
  Leaf,
  Plant,
  Shrimp,
  Spiral,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import {
  ALLERGY_CATALOG,
  ALLERGY_CODES,
  normalizeAllergies,
  type AllergyCode,
} from "@/lib/allergies";

const ALLERGY_ICONS: Record<AllergyCode, Icon> = {
  celery: Leaf,
  gluten: Grains,
  crustaceans: Shrimp,
  eggs: Egg,
  fish: FishSimple,
  lupin: FlowerLotus,
  milk: Cow,
  molluscs: Spiral,
  mustard: CirclesThree,
  nuts: Acorn,
  peanuts: CoffeeBean,
  sesame: CirclesFour,
  soybeans: Plant,
  sulphites: Flask,
};

function AllergyGlyph({
  code,
  className,
}: {
  code: AllergyCode;
  className?: string;
}) {
  const IconComponent = ALLERGY_ICONS[code];
  return (
    <IconComponent
      className={cn("shrink-0", className)}
      weight="regular"
      aria-hidden
    />
  );
}

export function AllergyTag({
  code,
  compact = false,
}: {
  code: AllergyCode;
  compact?: boolean;
}) {
  const def = ALLERGY_CATALOG[code];
  return (
    <span
      title={def.label}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-meridian-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        def.bgClass,
        def.textClass,
        compact && "px-1",
      )}
    >
      <AllergyGlyph code={code} className="size-3" />
      {compact ? null : (
        <span className="truncate">{def.shortLabel}</span>
      )}
    </span>
  );
}

export function AllergyTagStack({
  allergies,
  className,
  compact = false,
  emptyLabel = "—",
}: {
  allergies: string[] | null | undefined;
  className?: string;
  compact?: boolean;
  emptyLabel?: string;
}) {
  const codes = normalizeAllergies(allergies);
  if (codes.length === 0) {
    return (
      <span className={cn("text-sm text-meridian-text-muted", className)}>
        {emptyLabel}
      </span>
    );
  }

  return (
    <span
      className={cn("flex flex-wrap items-center gap-1", className)}
      aria-label={`Allergies: ${codes.map((code) => ALLERGY_CATALOG[code].label).join(", ")}`}
    >
      {codes.map((code) => (
        <AllergyTag key={code} code={code} compact={compact} />
      ))}
    </span>
  );
}

export function hasAllergies(allergies: string[] | null | undefined): boolean {
  return normalizeAllergies(allergies).length > 0;
}

export function AllergyEditor({
  value,
  onChange,
  className,
}: {
  value: AllergyCode[];
  onChange: (next: AllergyCode[]) => void;
  className?: string;
}) {
  const selected = new Set(value);

  const toggle = (code: AllergyCode) => {
    const next = selected.has(code)
      ? value.filter((item) => item !== code)
      : normalizeAllergies([...value, code]);
    onChange(next);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-xs text-meridian-text-muted">
        Tap to add or remove allergens for this booking.
      </p>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Allergies"
      >
        {ALLERGY_CODES.map((code) => {
          const def = ALLERGY_CATALOG[code];
          const isOn = selected.has(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              aria-pressed={isOn}
              title={def.label}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 rounded-meridian-sm border px-1.5 py-1 text-[10px] font-semibold tracking-wide uppercase transition-colors",
                isOn
                  ? cn(def.bgClass, def.textClass, "border-transparent")
                  : "border-meridian-border bg-meridian-surface text-meridian-text-muted hover:border-meridian-accent hover:text-meridian-text",
              )}
            >
              <AllergyGlyph code={code} className="size-3" />
              <span>{def.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
