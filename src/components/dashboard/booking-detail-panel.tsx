"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  AllergyEditor,
  AllergyTagStack,
  hasAllergies,
} from "@/components/dashboard/allergy-tags";
import { StatusLabel, Button } from "@/components/ui";
import {
  cancelBooking,
  declineBooking,
  updateBookingDetails,
  type BookingActionState,
} from "@/lib/dashboard/booking-actions";
import { normalizeAllergies, type AllergyCode } from "@/lib/allergies";
import { cn } from "@/lib/cn";
import type { BookingListItem } from "@/lib/dashboard/bookings";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";

const initialAction: BookingActionState = { status: "idle", message: null };

/** Placeholder options until settings supply real tables / party sizes. */
const TABLE_OPTIONS = ["1 of 1"] as const;
const GUEST_OPTIONS = ["1 of 1"] as const;

const TIME_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const hour = 10 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

function seatsValue(guestCount: number | null): string {
  return guestCount == null ? "—" : String(guestCount);
}

function tableValue(assignedTable: string | null | undefined): string {
  const value = assignedTable?.trim();
  return value ? value : "—";
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeToInput(value: string): string {
  return value.slice(0, 5);
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
    </svg>
  );
}

function IconCancel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm3.54 13.54-1.41 1.41L12 13.41l-2.13 2.13-1.41-1.41L10.59 12 8.46 9.87l1.41-1.41L12 10.59l2.13-2.13 1.41 1.41L13.41 12l2.13 2.13Z" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7Zm0 16H5V5h11.17L19 7.83V19ZM12 12a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm-5-6h8v3H7Z" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5 border-t border-[color-mix(in_srgb,var(--meridian-accent)_28%,transparent)] pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold tracking-wide text-meridian-accent uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 whitespace-pre-wrap text-sm text-meridian-text">
        {value}
      </dd>
    </div>
  );
}

type BookingDetailPanelProps = {
  businessId: string;
  booking: BookingListItem;
  titleId: string;
  onClose: () => void;
  onChanged: () => void;
};

export function BookingDetailPanel({
  businessId,
  booking,
  titleId,
  onClose,
  onChanged,
}: BookingDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [allergyConfirmOpen, setAllergyConfirmOpen] = useState(false);
  const saveFormRef = useRef<HTMLFormElement>(null);
  const [preferredDate, setPreferredDate] = useState(booking.preferred_date);
  const [preferredTime, setPreferredTime] = useState(
    timeToInput(booking.preferred_time),
  );
  const [guestOption, setGuestOption] = useState<string>(GUEST_OPTIONS[0]);
  const [tableOption, setTableOption] = useState(
    () => booking.assigned_table?.trim() || TABLE_OPTIONS[0],
  );
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [allergies, setAllergies] = useState<AllergyCode[]>(() =>
    normalizeAllergies(booking.allergies),
  );

  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelBooking,
    initialAction,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBooking,
    initialAction,
  );
  const [saveState, saveAction, savePending] = useActionState(
    updateBookingDetails,
    initialAction,
  );

  useEffect(() => {
    if (
      cancelState.status === "success" ||
      declineState.status === "success" ||
      saveState.status === "success"
    ) {
      onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelState.status, declineState.status, saveState.status]);

  const canCancelConfirmed = booking.status === "confirmed";
  const canCancelPending =
    booking.status === "pending" || booking.status === "suggested";
  const feedback =
    [cancelState, declineState, saveState].find(
      (state) => state.status !== "idle",
    ) ?? null;

  const tableOptions = useMemo(() => {
    const current = booking.assigned_table?.trim();
    if (current && !TABLE_OPTIONS.includes(current as (typeof TABLE_OPTIONS)[number])) {
      return [current, ...TABLE_OPTIONS];
    }
    return [...TABLE_OPTIONS];
  }, [booking.assigned_table]);

  const startEditing = () => {
    setPreferredDate(booking.preferred_date);
    setPreferredTime(timeToInput(booking.preferred_time));
    setGuestOption(GUEST_OPTIONS[0]);
    setTableOption(booking.assigned_table?.trim() || TABLE_OPTIONS[0]);
    setNotes(booking.notes ?? "");
    setAllergies(normalizeAllergies(booking.allergies));
    setAllergyConfirmOpen(false);
    setEditing(true);
  };

  const requestSave = () => {
    if (allergies.length > 0) {
      setAllergyConfirmOpen(true);
      return;
    }
    saveFormRef.current?.requestSubmit();
  };

  const confirmAllergySave = () => {
    setAllergyConfirmOpen(false);
    saveFormRef.current?.requestSubmit();
  };

  const dismissAllergyConfirm = () => {
    setAllergyConfirmOpen(false);
  };

  const closePanelWithoutSaving = () => {
    setAllergyConfirmOpen(false);
    onClose();
  };

  const displayedAllergies = editing ? allergies : booking.allergies;

  const guestCountForSave =
    guestOption === "1 of 1"
      ? (booking.guest_count ?? 1)
      : Number(guestOption) || booking.guest_count || 1;

  const selectClass =
    "h-10 w-full cursor-pointer appearance-none rounded-meridian-sm border border-meridian-border bg-meridian-surface px-3 pr-9 text-sm text-meridian-text " +
    "bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat " +
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%235a7580%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E')]";

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-3 sm:p-5 lg:p-8">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-[#143a44]/45 backdrop-blur-[2px]"
        aria-label="Close booking details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden rounded-meridian border border-meridian-border bg-meridian-surface shadow-[0_24px_80px_rgba(20,58,68,0.28)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--meridian-accent)_28%,transparent)] px-5 py-4">
          <div className="min-w-0 space-y-2">
            <StatusLabel status={booking.status} />
            <h2
              id={titleId}
              className="truncate text-xl font-semibold tracking-tight text-meridian-text"
            >
              {booking.customer_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-meridian-border text-meridian-text-muted transition-colors hover:border-meridian-accent hover:bg-[color-mix(in_srgb,var(--meridian-accent)_12%,white)] hover:text-meridian-text"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Section title="Contact">
            <dl className="space-y-3.5">
              <DetailRow label="Email" value={booking.customer_email} />
              <DetailRow
                label="Phone"
                value={booking.customer_phone || "—"}
              />
            </dl>
          </Section>

          <Section title="Table & guests">
            {editing ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="space-y-2 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Guests
                  <select
                    className={selectClass}
                    value={guestOption}
                    onChange={(event) => setGuestOption(event.target.value)}
                  >
                    {GUEST_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Table assigned
                  <select
                    className={selectClass}
                    value={tableOption}
                    onChange={(event) => setTableOption(event.target.value)}
                  >
                    {tableOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <dl className="grid gap-3.5 sm:grid-cols-2">
                <DetailRow
                  label="Guests"
                  value={seatsValue(booking.guest_count)}
                />
                <DetailRow
                  label="Table assigned"
                  value={tableValue(booking.assigned_table)}
                />
              </dl>
            )}
          </Section>

          <Section title="Allergies">
            <div
              className={cn(
                "rounded-meridian-sm px-3 py-3",
                editing
                  ? "border border-meridian-border bg-meridian-surface"
                  : hasAllergies(displayedAllergies)
                    ? "bg-[color-mix(in_srgb,#e11d48_4.5%,white)]"
                    : "bg-meridian-surface-muted",
              )}
            >
              {editing ? (
                <AllergyEditor value={allergies} onChange={setAllergies} />
              ) : (
                <AllergyTagStack
                  allergies={booking.allergies}
                  emptyLabel="No allergies recorded"
                />
              )}
            </div>
          </Section>

          <Section title="Booking details">
            {editing ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                    Date
                  </p>
                  <MiniCalendar
                    value={preferredDate}
                    onChange={setPreferredDate}
                  />
                </div>
                <label className="block space-y-2 text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Time
                  <select
                    className={selectClass}
                    value={preferredTime}
                    onChange={(event) => setPreferredTime(event.target.value)}
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
                </label>
                <dl className="pt-1">
                  <DetailRow
                    label="Created"
                    value={formatWhen(booking.created_at)}
                  />
                </dl>
              </div>
            ) : (
              <dl className="space-y-3.5">
                <DetailRow
                  label="Date"
                  value={booking.preferred_date}
                />
                <DetailRow
                  label="Time"
                  value={booking.preferred_time.slice(0, 5)}
                />
                {booking.suggested_date ? (
                  <DetailRow
                    label="Suggested time"
                    value={`${booking.suggested_date} at ${(booking.suggested_time ?? "").slice(0, 5)}`}
                  />
                ) : null}
                <DetailRow
                  label="Created"
                  value={formatWhen(booking.created_at)}
                />
              </dl>
            )}
          </Section>

          {editing || booking.notes?.trim() ? (
            <Section title="Request">
              {editing ? (
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  aria-label="Request notes"
                  className="mt-0.5 w-full cursor-text rounded-meridian-sm border border-meridian-border bg-meridian-surface px-3 py-2.5 text-sm text-meridian-text"
                />
              ) : (
                <div className="rounded-meridian-sm border border-meridian-border bg-meridian-surface-muted px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-sm text-meridian-text">
                    {booking.notes?.trim()}
                  </p>
                </div>
              )}
            </Section>
          ) : null}

          {feedback ? (
            <p
              className={
                feedback.status === "error"
                  ? "pt-4 text-sm text-meridian-status-declined"
                  : "pt-4 text-sm text-meridian-teal"
              }
              role="status"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-[color-mix(in_srgb,var(--meridian-accent)_28%,transparent)] px-5 py-4">
          {editing ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <form ref={saveFormRef} action={saveAction} className="flex-1">
                <input type="hidden" name="businessId" value={businessId} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="preferredDate" value={preferredDate} />
                <input type="hidden" name="preferredTime" value={preferredTime} />
                <input
                  type="hidden"
                  name="guestCount"
                  value={String(guestCountForSave)}
                />
                <input type="hidden" name="assignedTable" value={tableOption} />
                <input type="hidden" name="notes" value={notes} />
                <input
                  type="hidden"
                  name="allergies"
                  value={allergies.join(",")}
                />
                <Button
                  type="button"
                  variant="accent"
                  fullWidth
                  disabled={savePending}
                  onClick={requestSave}
                >
                  <IconSave />
                  {savePending ? "Saving…" : "Save"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {canCancelConfirmed ? (
                <form action={cancelAction} className="flex-1">
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    fullWidth
                    disabled={cancelPending}
                  >
                    <IconCancel />
                    {cancelPending ? "Cancelling…" : "Cancel"}
                  </Button>
                </form>
              ) : null}
              {canCancelPending ? (
                <form action={declineAction} className="flex-1">
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    fullWidth
                    disabled={declinePending}
                  >
                    <IconCancel />
                    {declinePending ? "Cancelling…" : "Cancel"}
                  </Button>
                </form>
              ) : null}
              {!canCancelConfirmed && !canCancelPending ? (
                <div className="flex-1" />
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={startEditing}
              >
                <IconEdit />
                Edit
              </Button>
            </div>
          )}
        </footer>
      </aside>

      {allergyConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-[#143a44]/50 backdrop-blur-[2px]"
            aria-label="Dismiss allergy confirmation"
            onClick={dismissAllergyConfirm}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="allergy-confirm-title"
            aria-describedby="allergy-confirm-desc"
            className="relative z-10 w-full max-w-sm rounded-meridian border border-meridian-border bg-meridian-surface p-5 shadow-[0_24px_80px_rgba(20,58,68,0.35)]"
          >
            <h3
              id="allergy-confirm-title"
              className="text-base font-semibold tracking-tight text-meridian-text"
            >
              Allergy noticed
            </h3>
            <p
              id="allergy-confirm-desc"
              className="mt-2 text-sm text-meridian-text-muted"
            >
              Make sure to alert the team and kitchen before saving this
              booking.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                type="button"
                variant="accent"
                fullWidth
                disabled={savePending}
                onClick={confirmAllergySave}
              >
                <IconSave />
                {savePending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={dismissAllergyConfirm}
              >
                Back to edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={closePanelWithoutSaving}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
