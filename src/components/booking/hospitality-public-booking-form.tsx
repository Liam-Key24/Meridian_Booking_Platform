"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react";
import { AllergyEditor } from "@/components/dashboard/allergy-tags";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { Button, Input, Textarea } from "@/components/ui";
import { type AllergyCode } from "@/lib/allergies";
import {
  submitBookingRequest,
  type SubmitBookingState,
} from "@/lib/booking/actions";
import { cn } from "@/lib/cn";
import {
  CLIENT_SURFACE_ERROR,
  CLIENT_SURFACE_FIELD,
  CLIENT_SURFACE_FIELD_ERROR,
  CLIENT_SURFACE_LABEL,
  CLIENT_SURFACE_MUTED,
  CLIENT_SURFACE_PANEL,
} from "@/lib/templates/client-surface-theme";
import { todayLocalIso } from "@/lib/dashboard/calendar";

type HospitalityPublicBookingFormProps = {
  businessSlug: string;
  businessName: string;
  maxPartySize?: number | null;
  turnstileSiteKey?: string | null;
  submitLabel?: string;
  embed?: boolean;
};

const initialState: SubmitBookingState = {
  status: "idle",
  message: null,
};

const TIME_OPTIONS = Array.from({ length: 60 }, (_, index) => {
  const hour = 8 + Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

type FieldErrors = Partial<
  Record<
    | "customerName"
    | "customerEmail"
    | "preferredDate"
    | "preferredTime"
    | "guestCount"
    | "allergies",
    string
  >
>;

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function FieldShell({
  label,
  required,
  error,
  children,
  embed = false,
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  embed?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-sm">
      <span className={embed ? CLIENT_SURFACE_LABEL : "font-medium text-meridian-text"}>
        {label}
        {required ? (
          <span className={embed ? CLIENT_SURFACE_ERROR : "text-meridian-status-declined"}>
            {" "}
            *
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span
          className={embed ? CLIENT_SURFACE_ERROR : "text-meridian-status-declined"}
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

const selectClass =
  "h-11 w-full cursor-pointer appearance-none rounded-meridian border bg-meridian-surface px-4 pr-10 text-sm text-meridian-text " +
  "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] " +
  "bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat " +
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%235a7580%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')]";

const embedSelectClass =
  "h-11 w-full cursor-pointer appearance-none px-4 pr-10 text-sm " +
  CLIENT_SURFACE_FIELD +
  " bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat " +
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%235a7580%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')]";

export function HospitalityPublicBookingForm({
  businessSlug,
  businessName,
  maxPartySize = null,
  turnstileSiteKey,
  submitLabel = "Find a Table",
  embed = false,
}: HospitalityPublicBookingFormProps) {
  const [state, formAction, pending] = useActionState(
    submitBookingRequest,
    initialState,
  );
  const turnstileId = useId();
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const dateButtonId = useId();
  const partyMax =
    maxPartySize && maxPartySize > 0 ? maxPartySize : 20;

  const [preferredDate, setPreferredDate] = useState(todayLocalIso());
  const [preferredTime, setPreferredTime] = useState("19:00");
  const [guestCount, setGuestCount] = useState("2");
  const [allergies, setAllergies] = useState<AllergyCode[]>([]);
  const [noAllergies, setNoAllergies] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!dateOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!datePopoverRef.current?.contains(event.target as Node)) {
        setDateOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDateOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [dateOpen]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      next.preferredDate = "Choose a date.";
    }
    if (!TIME_OPTIONS.includes(preferredTime)) {
      next.preferredTime = "Choose a time.";
    }
    const guests = Number.parseInt(guestCount, 10);
    if (!Number.isFinite(guests) || guests < 1 || guests > partyMax) {
      next.guestCount =
        maxPartySize && maxPartySize > 0
          ? `Party size must be between 1 and ${maxPartySize}.`
          : "Guests must be at least 1.";
    }
    if (!noAllergies && allergies.length === 0) {
      next.allergies = "Select allergies or choose No allergies.";
    }
    return next;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
    }
  };

  if (state.status === "success") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-meridian px-5 py-6",
          embed
            ? cn(
                CLIENT_SURFACE_PANEL,
                "border-[color-mix(in_srgb,var(--client-accent)_25%,transparent)]",
              )
            : "border border-meridian-status-confirmed/30 bg-meridian-status-confirmed-bg",
        )}
        role="status"
      >
        <h2
          className={cn(
            "text-lg font-semibold",
            embed ? "text-[var(--client-text)]" : "text-meridian-text",
          )}
        >
          Request received
        </h2>
        <p className={cn("text-sm", embed ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted")}>
          {state.message}
        </p>
        <p className={cn("text-sm", embed ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted")}>
          {businessName} will review your request. You have not been confirmed
          yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      ) : null}
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <input type="hidden" name="preferredDate" value={preferredDate} />
        <input type="hidden" name="preferredTime" value={preferredTime} />
        <input
          type="hidden"
          name="allergies"
          value={noAllergies ? "" : allergies.join(",")}
        />
        {noAllergies ? (
          <input type="hidden" name="noAllergies" value="on" />
        ) : null}

        <div
          className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
          aria-hidden
        >
          <label>
            Company website
            <input
              type="text"
              name="companyWebsite"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Input
              label="Name"
              name="customerName"
              placeholder="Your name"
              required
              autoComplete="name"
              surface={embed ? "client" : "meridian"}
            />
            <Input
              label="Email"
              name="customerEmail"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              surface={embed ? "client" : "meridian"}
            />
            <Input
              label="Phone"
              name="customerPhone"
              type="tel"
              placeholder="+44…"
              autoComplete="tel"
              surface={embed ? "client" : "meridian"}
            />
            <Input
              label={
                maxPartySize
                  ? `Guests (max ${maxPartySize})`
                  : "Guests"
              }
              name="guestCount"
              type="number"
              min={1}
              max={partyMax}
              required
              value={guestCount}
              onChange={(event) => setGuestCount(event.target.value)}
              error={errors.guestCount}
              surface={embed ? "client" : "meridian"}
            />
          </div>

          <div className="space-y-4">
            <FieldShell label="Date" required error={errors.preferredDate} embed={embed}>
              <div className="relative" ref={datePopoverRef}>
                <button
                  id={dateButtonId}
                  type="button"
                  onClick={() => setDateOpen((open) => !open)}
                  aria-expanded={dateOpen}
                  aria-haspopup="dialog"
                  className={cn(
                    embed
                      ? cn(
                          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 px-4 text-left text-sm",
                          CLIENT_SURFACE_FIELD,
                        )
                      : cn(
                          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-meridian border bg-meridian-surface px-4 text-left text-sm text-meridian-text",
                          "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
                        ),
                    errors.preferredDate
                      ? embed
                        ? CLIENT_SURFACE_FIELD_ERROR
                        : "border-meridian-status-declined"
                      : embed
                        ? undefined
                        : "border-meridian-border",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarBlank
                      className={cn(
                        "size-4",
                        embed ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted",
                      )}
                      weight="regular"
                      aria-hidden
                    />
                    {formatDateLabel(preferredDate)}
                  </span>
                  <CaretDown
                    className={cn(
                      "size-4",
                      embed ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted",
                    )}
                    weight="bold"
                    aria-hidden
                  />
                </button>
                {dateOpen ? (
                  <div
                    role="dialog"
                    aria-labelledby={dateButtonId}
                    className={cn(
                      "absolute z-30 mt-2 w-[min(100%,20rem)] rounded-meridian p-2 shadow-[0_16px_40px_rgba(20,58,68,0.18)]",
                      embed
                        ? CLIENT_SURFACE_PANEL
                        : "border border-meridian-border bg-meridian-surface",
                    )}
                  >
                    <MiniCalendar
                      value={preferredDate}
                      onChange={(next) => {
                        setPreferredDate(next);
                        setDateOpen(false);
                        setErrors((prev) => ({
                          ...prev,
                          preferredDate: undefined,
                        }));
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </FieldShell>

            <FieldShell label="Time" required error={errors.preferredTime} embed={embed}>
              <select
                className={cn(
                  embed ? embedSelectClass : selectClass,
                  errors.preferredTime
                    ? embed
                      ? CLIENT_SURFACE_FIELD_ERROR
                      : "border-meridian-status-declined"
                    : embed
                      ? undefined
                      : "border-meridian-border",
                )}
                value={preferredTime}
                onChange={(event) => {
                  setPreferredTime(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    preferredTime: undefined,
                  }));
                }}
                aria-invalid={errors.preferredTime ? true : undefined}
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
        </div>

        <FieldShell label="Allergies" required error={errors.allergies} embed={embed}>
          <div
            className={cn(
              embed ? cn("p-3", CLIENT_SURFACE_PANEL) : "rounded-meridian border bg-meridian-surface p-3",
              errors.allergies
                ? embed
                  ? CLIENT_SURFACE_FIELD_ERROR
                  : "border-meridian-status-declined"
                : embed
                  ? undefined
                  : "border-meridian-border",
            )}
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={noAllergies}
                onClick={() => {
                  setNoAllergies(true);
                  setAllergies([]);
                  setErrors((prev) => ({ ...prev, allergies: undefined }));
                }}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-meridian-sm border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase transition-colors",
                  noAllergies
                    ? embed
                      ? "border-transparent bg-[var(--client-accent)] text-[var(--client-background)]"
                      : "border-transparent bg-meridian-teal text-meridian-text-inverse"
                    : embed
                      ? "border-[color-mix(in_srgb,var(--client-text)_20%,transparent)] bg-[var(--client-background)] text-[color-mix(in_srgb,var(--client-text)_60%,transparent)] hover:border-[var(--client-accent)] hover:text-[var(--client-text)]"
                      : "border-meridian-border bg-meridian-surface text-meridian-text-muted hover:border-meridian-accent hover:text-meridian-text",
                )}
              >
                No allergies
              </button>
            </div>
            <AllergyEditor
              value={allergies}
              onChange={(next) => {
                setAllergies(next);
                setNoAllergies(false);
                setErrors((prev) => ({ ...prev, allergies: undefined }));
              }}
              surface={embed ? "client" : "meridian"}
            />
          </div>
        </FieldShell>

        <Textarea
          label="Notes / request"
          name="notes"
          rows={3}
          placeholder="Occasion, seating preferences, accessibility needs…"
          hint="Optional"
          surface={embed ? "client" : "meridian"}
        />

        <label
          className={cn(
            "flex items-start gap-3 text-sm",
            embed ? "text-[var(--client-text)]" : "text-meridian-text",
          )}
        >
          <input
            type="checkbox"
            name="privacyConsent"
            className={cn(
              "mt-1 h-4 w-4 rounded",
              embed
                ? "border-[color-mix(in_srgb,var(--client-text)_20%,transparent)] accent-[var(--client-accent)]"
                : "border-meridian-border",
            )}
            required
          />
          <span>
            I understand this is a booking <strong>request</strong>, not a
            confirmation, and I consent to {businessName} contacting me about
            this request.
          </span>
        </label>

        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-theme="light"
            id={turnstileId}
          />
        ) : null}

        {state.status === "error" && state.message ? (
          <p
            className={cn(
              "text-sm",
              embed ? CLIENT_SURFACE_ERROR : "text-meridian-status-declined",
            )}
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          fullWidth
          disabled={pending}
          className={embed ? "rounded-full hover:opacity-90" : undefined}
          style={
            embed
              ? {
                  backgroundColor: "var(--client-accent)",
                  color: "var(--client-background)",
                }
              : undefined
          }
        >
          {pending ? "Sending request…" : submitLabel}
        </Button>
      </form>
    </>
  );
}
