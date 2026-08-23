"use client";

import { useActionState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  approveBooking,
  cancelBooking,
  declineBooking,
  suggestBookingTime,
  type BookingActionState,
} from "@/lib/dashboard/booking-actions";
import type { BookingStatus } from "@/types/database";

type BookingActionsPanelProps = {
  businessId: string;
  bookingId: string;
  status: BookingStatus;
  suggestedDate: string | null;
  suggestedTime: string | null;
};

const initialState: BookingActionState = {
  status: "idle",
  message: null,
};

export function BookingActionsPanel({
  businessId,
  bookingId,
  status,
  suggestedDate,
  suggestedTime,
}: BookingActionsPanelProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveBooking,
    initialState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBooking,
    initialState,
  );
  const [suggestState, suggestAction, suggestPending] = useActionState(
    suggestBookingTime,
    initialState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelBooking,
    initialState,
  );

  const canDecide = status === "pending" || status === "suggested";
  const canCancel = status === "confirmed";
  const feedback =
    [approveState, declineState, suggestState, cancelState].find(
      (state) => state.status !== "idle",
    ) ?? null;

  if (!canDecide && !canCancel) {
    return (
      <p className="text-sm text-meridian-text-muted">
        No further actions for a {status} booking.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          className={
            feedback.status === "error"
              ? "text-sm text-meridian-status-declined"
              : "text-sm text-meridian-teal"
          }
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {canDecide ? (
        <>
          <form action={approveAction} className="space-y-3">
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <p className="text-sm text-meridian-text-muted">
              Confirm at the preferred time
              {status === "suggested" && suggestedDate
                ? ` (or the suggested ${suggestedDate} ${suggestedTime?.slice(0, 5) ?? ""})`
                : ""}
              . Sends a confirmation email with a calendar invite when email is
              configured.
            </p>
            <Button type="submit" disabled={approvePending}>
              {approvePending ? "Confirming…" : "Approve booking"}
            </Button>
          </form>

          <form action={declineAction} className="space-y-3 border-t border-meridian-border pt-6">
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <Textarea
              label="Decline note (optional)"
              name="reason"
              rows={3}
              placeholder="Brief note included in the customer email"
            />
            <Button type="submit" variant="danger" disabled={declinePending}>
              {declinePending ? "Declining…" : "Decline booking"}
            </Button>
          </form>

          <form action={suggestAction} className="space-y-3 border-t border-meridian-border pt-6">
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Suggested date"
                name="suggestedDate"
                type="date"
                required
                defaultValue={suggestedDate ?? undefined}
              />
              <Input
                label="Suggested time"
                name="suggestedTime"
                type="time"
                required
                defaultValue={suggestedTime?.slice(0, 5) ?? undefined}
              />
            </div>
            <Button type="submit" variant="secondary" disabled={suggestPending}>
              {suggestPending ? "Sending…" : "Suggest another time"}
            </Button>
          </form>
        </>
      ) : null}

      {canCancel ? (
        <form action={cancelAction} className="space-y-3">
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="bookingId" value={bookingId} />
          <p className="text-sm text-meridian-text-muted">
            Cancels this confirmed booking and notifies the customer when email
            is configured.
          </p>
          <Button type="submit" variant="danger" disabled={cancelPending}>
            {cancelPending ? "Cancelling…" : "Cancel booking"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
