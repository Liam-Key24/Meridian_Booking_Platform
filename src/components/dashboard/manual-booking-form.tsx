"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CalendarBlank, CaretDown, EnvelopeSimple } from "@phosphor-icons/react";
import { AllergyEditor } from "@/components/dashboard/allergy-tags";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { Button, Input, Textarea } from "@/components/ui";
import {
  createManualBooking,
  type BookingActionState,
} from "@/lib/dashboard/booking-actions";
import { type AllergyCode } from "@/lib/allergies";
import { cn } from "@/lib/cn";
import { todayLocalIso } from "@/lib/dashboard/calendar";

type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
};

type ManualBookingFormProps = {
  businessId: string;
  services: ServiceOption[];
  defaultDate?: string;
  defaultTime?: string;
};

const initialState: BookingActionState = {
  status: "idle",
  message: null,
};

const TABLE_OPTIONS = ["1 of 1"] as const;

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
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-sm">
      <span className="font-medium text-meridian-text">
        {label}
        {required ? <span className="text-meridian-status-declined"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-meridian-status-declined" role="alert">
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

export function ManualBookingForm({
  businessId,
  services,
  defaultDate,
  defaultTime,
}: ManualBookingFormProps) {
  const [state, formAction, pending] = useActionState(
    createManualBooking,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const dateButtonId = useId();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState(
    defaultDate ?? todayLocalIso(),
  );
  const [preferredTime, setPreferredTime] = useState(
    defaultTime && TIME_OPTIONS.includes(defaultTime)
      ? defaultTime
      : defaultTime?.slice(0, 5) && TIME_OPTIONS.includes(defaultTime.slice(0, 5))
        ? defaultTime.slice(0, 5)
        : "12:00",
  );
  const [guestCount, setGuestCount] = useState("1");
  const [assignedTable, setAssignedTable] = useState("");
  const [notes, setNotes] = useState("");
  const [allergies, setAllergies] = useState<AllergyCode[]>([]);
  const [noAllergies, setNoAllergies] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
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

  if (services.length === 0) {
    return (
      <p className="text-sm text-meridian-text-muted">
        Add an active service before creating a manual booking.
      </p>
    );
  }

  const defaultServiceId = services[0]!.id;

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (customerName.trim().length < 2) {
      next.customerName = "Enter the customer name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      next.customerEmail = "Enter a valid email.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      next.preferredDate = "Choose a date.";
    }
    if (!TIME_OPTIONS.includes(preferredTime)) {
      next.preferredTime = "Choose a time.";
    }
    const guests = Number.parseInt(guestCount, 10);
    if (!Number.isFinite(guests) || guests < 1) {
      next.guestCount = "Guests must be at least 1.";
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

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="serviceId" value={defaultServiceId} />
      <input type="hidden" name="preferredDate" value={preferredDate} />
      <input type="hidden" name="preferredTime" value={preferredTime} />
      <input
        type="hidden"
        name="allergies"
        value={noAllergies ? "" : allergies.join(",")}
      />
      <input type="hidden" name="assignedTable" value={assignedTable} />
      {sendConfirmation ? (
        <input type="hidden" name="sendConfirmation" value="on" />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Input
            label="Name"
            name="customerName"
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            error={errors.customerName}
            autoComplete="name"
          />
          <Input
            label="Email"
            name="customerEmail"
            type="email"
            required
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            error={errors.customerEmail}
            autoComplete="email"
          />
          <Input
            label="Phone"
            name="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            autoComplete="tel"
          />
          <Input
            label="Guests"
            name="guestCount"
            type="number"
            min={1}
            required
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
            error={errors.guestCount}
          />
        </div>

        <div className="space-y-4">
          <FieldShell
            label="Date"
            required
            error={errors.preferredDate}
          >
            <div className="relative" ref={datePopoverRef}>
              <button
                id={dateButtonId}
                type="button"
                onClick={() => setDateOpen((open) => !open)}
                aria-expanded={dateOpen}
                aria-haspopup="dialog"
                className={cn(
                  "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-meridian border bg-meridian-surface px-4 text-left text-sm text-meridian-text",
                  "transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)]",
                  errors.preferredDate
                    ? "border-meridian-status-declined"
                    : "border-meridian-border",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarBlank
                    className="size-4 text-meridian-text-muted"
                    weight="regular"
                    aria-hidden
                  />
                  {formatDateLabel(preferredDate)}
                </span>
                <CaretDown
                  className="size-4 text-meridian-text-muted"
                  weight="bold"
                  aria-hidden
                />
              </button>
              {dateOpen ? (
                <div
                  role="dialog"
                  aria-labelledby={dateButtonId}
                  className="absolute z-30 mt-2 w-[min(100%,20rem)] rounded-meridian border border-meridian-border bg-meridian-surface p-2 shadow-[0_16px_40px_rgba(20,58,68,0.18)]"
                >
                  <MiniCalendar
                    value={preferredDate}
                    onChange={(next) => {
                      setPreferredDate(next);
                      setDateOpen(false);
                      setErrors((prev) => ({ ...prev, preferredDate: undefined }));
                    }}
                  />
                </div>
              ) : null}
            </div>
          </FieldShell>

          <FieldShell label="Time" required error={errors.preferredTime}>
            <select
              className={cn(
                selectClass,
                errors.preferredTime
                  ? "border-meridian-status-declined"
                  : "border-meridian-border",
              )}
              value={preferredTime}
              onChange={(event) => {
                setPreferredTime(event.target.value);
                setErrors((prev) => ({ ...prev, preferredTime: undefined }));
              }}
              aria-invalid={errors.preferredTime ? true : undefined}
            >
              {!TIME_OPTIONS.includes(preferredTime) ? (
                <option value={preferredTime}>{preferredTime}</option>
              ) : null}
              {TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell
            label={
              <>
                Table number
                <span className="ml-2 font-normal text-meridian-text-muted">
                  Staff only
                </span>
              </>
            }
          >
            <select
              className={cn(selectClass, "border-meridian-border")}
              value={assignedTable}
              onChange={(event) => setAssignedTable(event.target.value)}
            >
              <option value="">None (optional)</option>
              {TABLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldShell>
        </div>
      </div>

      <FieldShell label="Allergies" required error={errors.allergies}>
        <div
          className={cn(
            "rounded-meridian border bg-meridian-surface p-3",
            errors.allergies
              ? "border-meridian-status-declined"
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
                  ? "border-transparent bg-meridian-teal text-meridian-text-inverse"
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
          />
        </div>
      </FieldShell>

      <Textarea
        label="Notes / request"
        name="notes"
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        hint="Optional"
      />

      <button
        type="button"
        role="switch"
        aria-checked={sendConfirmation}
        onClick={() => setSendConfirmation((value) => !value)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-meridian border px-4 py-3 text-left transition-colors",
          sendConfirmation
            ? "border-[color-mix(in_srgb,var(--meridian-teal)_35%,white)] bg-[color-mix(in_srgb,var(--meridian-teal)_8%,white)]"
            : "border-meridian-border bg-meridian-surface hover:bg-meridian-surface-muted",
        )}
      >
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            sendConfirmation
              ? "bg-meridian-teal text-meridian-text-inverse"
              : "bg-meridian-surface-muted text-meridian-text-muted",
          )}
        >
          <EnvelopeSimple className="size-5" weight="regular" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-meridian-text">
            Send confirmation email
          </span>
          <span className="mt-0.5 block text-xs text-meridian-text-muted">
            Includes a calendar invite for the guest.
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            sendConfirmation ? "bg-meridian-teal" : "bg-meridian-border-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
              sendConfirmation ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </span>
      </button>

      {state.status === "error" ? (
        <p className="text-sm text-meridian-status-declined" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Creating…" : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
