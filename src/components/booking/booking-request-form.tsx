"use client";

import { useActionState, useId, useMemo } from "react";
import Script from "next/script";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  submitBookingRequest,
  type SubmitBookingState,
} from "@/lib/booking/actions";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
};

type BookingRequestFormProps = {
  businessSlug: string;
  businessName: string;
  services: ServiceOption[];
  turnstileSiteKey?: string | null;
  submitLabel?: string;
  embed?: boolean;
};

const initialState: SubmitBookingState = {
  status: "idle",
  message: null,
};

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BookingRequestForm({
  businessSlug,
  businessName,
  services,
  turnstileSiteKey,
  submitLabel = "Submit request",
  embed = false,
}: BookingRequestFormProps) {
  const [state, formAction, pending] = useActionState(
    submitBookingRequest,
    initialState,
  );
  const turnstileId = useId();
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);

  if (state.status === "success") {
    return (
      <div
        className="space-y-3 rounded-meridian border border-meridian-status-confirmed/30 bg-meridian-status-confirmed-bg px-5 py-6"
        role="status"
      >
        <h2 className="text-lg font-semibold text-meridian-text">
          Request received
        </h2>
        <p className="text-sm text-meridian-text-muted">{state.message}</p>
        <p className="text-sm text-meridian-text-muted">
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
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

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

        <Input
          label="Name"
          name="customerName"
          placeholder="Your name"
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          name="customerEmail"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Phone"
          name="customerPhone"
          type="tel"
          placeholder="+44…"
          autoComplete="tel"
        />
        <Select
          label="Service"
          name="serviceId"
          required
          placeholder="Select a service"
          defaultValue=""
          options={services.map((service) => ({
            value: service.id,
            label: `${service.name} (${service.duration_minutes} min)`,
          }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Preferred date"
            name="preferredDate"
            type="date"
            required
          />
          <Input
            label="Preferred time"
            name="preferredTime"
            type="time"
            required
          />
        </div>
        <Input
          label="Guest count (optional)"
          name="guestCount"
          type="number"
          min={1}
          max={100}
        />
        <Textarea
          label="Notes (optional)"
          name="notes"
          placeholder="Anything we should know?"
          rows={3}
        />

        <label className="flex items-start gap-3 text-sm text-meridian-text">
          <input
            type="checkbox"
            name="privacyConsent"
            className="mt-1 h-4 w-4 rounded border-meridian-border"
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
          <p className="text-sm text-meridian-status-declined" role="alert">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={pending} className={embed ? "rounded-full" : undefined}>
          {pending ? "Sending request…" : submitLabel}
        </Button>
      </form>
    </>
  );
}
