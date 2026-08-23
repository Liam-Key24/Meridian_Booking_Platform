"use client";

import { useActionState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  createManualBooking,
  type BookingActionState,
} from "@/lib/dashboard/booking-actions";

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

  if (services.length === 0) {
    return (
      <p className="text-sm text-meridian-text-muted">
        Add an active service before creating a manual booking.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <Select
        label="Service"
        name="serviceId"
        required
        options={services.map((service) => ({
          value: service.id,
          label: `${service.name} (${service.duration_minutes} min)`,
        }))}
      />
      <Input label="Customer name" name="customerName" required />
      <Input
        label="Customer email"
        name="customerEmail"
        type="email"
        required
      />
      <Input label="Customer phone" name="customerPhone" type="tel" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Date"
          name="preferredDate"
          type="date"
          required
          defaultValue={defaultDate}
        />
        <Input
          label="Time"
          name="preferredTime"
          type="time"
          required
          defaultValue={defaultTime}
        />
      </div>
      <Input label="Guests" name="guestCount" type="number" min={1} />
      <Textarea label="Notes" name="notes" rows={3} />
      <label className="flex items-center gap-2 text-sm text-meridian-text">
        <input
          type="checkbox"
          name="sendConfirmation"
          defaultChecked
          className="size-4 rounded border-meridian-border"
        />
        Send confirmation email with calendar invite
      </label>
      {state.status === "error" ? (
        <p className="text-sm text-meridian-status-declined" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create confirmed booking"}
      </Button>
    </form>
  );
}
