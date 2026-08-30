"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Acorn,
  CaretDown,
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
  CLIENT_SURFACE_ERROR,
  CLIENT_SURFACE_FIELD,
  CLIENT_SURFACE_FIELD_ERROR,
  CLIENT_SURFACE_HINT,
  CLIENT_SURFACE_LABEL,
  CLIENT_SURFACE_MUTED,
  CLIENT_SURFACE_PANEL,
  type SurfaceTheme,
} from "@/lib/templates/client-surface-theme";
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

export function AllergyDropdown({
  value,
  onChange,
  noAllergies,
  onNoAllergiesChange,
  error,
}: {
  value: AllergyCode[];
  onChange: (next: AllergyCode[]) => void;
  noAllergies: boolean;
  onNoAllergiesChange: (next: boolean) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const available = ALLERGY_CODES.filter((code) => !value.includes(code));
  const triggerLabel = noAllergies
    ? "No allergies"
    : value.length > 0
      ? "Add another allergy"
      : "Select allergies";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="space-y-3">
      <div className="relative" ref={popoverRef}>
        <button
          id={buttonId}
          type="button"
          onClick={() => setOpen((next) => !next)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Add an allergy"
          aria-invalid={error ? true : undefined}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-meridian border bg-meridian-surface px-4 text-left text-sm text-meridian-text",
            "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
            error
              ? "border-meridian-status-declined"
              : "border-meridian-border",
          )}
        >
          <span>{triggerLabel}</span>
          <CaretDown
            className="size-4 shrink-0 text-meridian-text-muted"
            weight="bold"
            aria-hidden
          />
        </button>
        {open ? (
          <div
            role="listbox"
            aria-labelledby={buttonId}
            className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-meridian border border-meridian-border bg-meridian-surface py-1 shadow-[0_16px_40px_rgba(20,58,68,0.18)]"
          >
            <button
              type="button"
              role="option"
              aria-selected={noAllergies}
              onClick={() => {
                onNoAllergiesChange(true);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer px-4 py-2 text-left text-sm text-meridian-text hover:bg-meridian-surface-subtle",
                noAllergies && "bg-meridian-surface-subtle font-medium",
              )}
            >
              No allergies
            </button>
            {available.map((code) => (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(normalizeAllergies([...value, code]));
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer px-4 py-2 text-left text-sm text-meridian-text hover:bg-meridian-surface-subtle"
              >
                {ALLERGY_CATALOG[code].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {noAllergies ? (
        <span className="inline-flex items-center gap-1 rounded-meridian-sm bg-[#e7f4ea] px-2 py-1 text-[10px] font-semibold tracking-wide text-[#2f6b3a] uppercase">
          No allergies
          <button
            type="button"
            onClick={() => onNoAllergiesChange(false)}
            className="!rounded-sm !bg-transparent !text-[#2f6b3a] hover:!text-meridian-text"
            aria-label="Clear no allergies"
          >
            ×
          </button>
        </span>
      ) : value.length > 0 ? (
        <span className="flex flex-wrap items-center gap-1.5">
          {value.map((code) => (
            <span key={code} className="inline-flex items-center gap-0.5">
              <AllergyTag code={code} />
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== code))}
                className="px-0.5 !rounded-sm !bg-transparent !text-meridian-text-muted hover:!text-meridian-text"
                aria-label={`Remove ${ALLERGY_CATALOG[code].label}`}
              >
                ×
              </button>
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

export function AllergyEditor({
  value,
  onChange,
  className,
  surface = "meridian",
}: {
  value: AllergyCode[];
  onChange: (next: AllergyCode[]) => void;
  className?: string;
  surface?: SurfaceTheme;
}) {
  const selected = new Set(value);
  const isClient = surface === "client";

  const toggle = (code: AllergyCode) => {
    const next = selected.has(code)
      ? value.filter((item) => item !== code)
      : normalizeAllergies([...value, code]);
    onChange(next);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <p className={cn("text-xs", isClient ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted")}>
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
                  ? isClient
                    ? "border-transparent bg-[var(--client-accent)] text-[var(--client-background)]"
                    : cn(def.bgClass, def.textClass, "border-transparent")
                  : isClient
                    ? "border-[color-mix(in_srgb,var(--client-text)_20%,transparent)] bg-[var(--client-background)] text-[color-mix(in_srgb,var(--client-text)_60%,transparent)] hover:border-[var(--client-accent)] hover:text-[var(--client-text)]"
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
