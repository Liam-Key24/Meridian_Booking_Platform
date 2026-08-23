"use client";

import { useActionState } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  updateBusinessSettings,
  type SettingsActionState,
} from "@/lib/dashboard/settings-actions";
import type { BookingMode } from "@/types/database";

type SettingsFormProps = {
  businessId: string;
  name: string;
  notificationEmail: string;
  timezone: string;
  bookingMode: BookingMode;
  externalBookingUrl: string;
  canEdit: boolean;
};

const initialState: SettingsActionState = {
  status: "idle",
  message: null,
};

export function BusinessSettingsForm({
  businessId,
  name,
  notificationEmail,
  timezone,
  bookingMode,
  externalBookingUrl,
  canEdit,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateBusinessSettings,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <Input
        label="Business name"
        name="name"
        defaultValue={name}
        required
        disabled={!canEdit}
      />
      <Input
        label="Notification email"
        name="notificationEmail"
        type="email"
        defaultValue={notificationEmail}
        required
        disabled={!canEdit}
      />
      <Input
        label="Timezone"
        name="timezone"
        defaultValue={timezone}
        hint="IANA timezone, e.g. Europe/London"
        required
        disabled={!canEdit}
      />
      <Select
        label="Booking mode"
        name="bookingMode"
        defaultValue={bookingMode}
        disabled={!canEdit}
        options={[
          { value: "meridian", label: "Meridian requests" },
          { value: "external", label: "External provider only" },
          { value: "hybrid", label: "Hybrid (both)" },
        ]}
      />
      <Input
        label="External booking URL"
        name="externalBookingUrl"
        type="url"
        defaultValue={externalBookingUrl}
        hint="Required for external or hybrid mode"
        disabled={!canEdit}
      />

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-meridian-status-declined"
              : "text-sm text-meridian-status-confirmed"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      {canEdit ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      ) : (
        <p className="text-sm text-meridian-text-muted">
          Only business owners can change these settings.
        </p>
      )}
    </form>
  );
}
