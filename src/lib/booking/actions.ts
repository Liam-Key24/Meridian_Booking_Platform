"use server";

import { headers } from "next/headers";
import { sendBookingRequestEmails } from "@/lib/booking/emails";
import { getPublicBookingPage } from "@/lib/booking/public-page";
import {
  buildEmailRateLimitKey,
  buildIpRateLimitKey,
  getRateLimitHmacSecret,
} from "@/lib/booking/rate-limit-keys";
import { assertWithinRateLimit } from "@/lib/booking/rate-limit";
import { verifyTurnstileToken } from "@/lib/booking/turnstile";
import {
  validateBookingRequest,
  type BookingRequestInput,
} from "@/lib/booking/validation";
import { getTrustedClientIp } from "@/lib/server/client-ip";
import {
  createOperationId,
  logServerEvent,
} from "@/lib/server/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type SubmitBookingState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const SUCCESS_MESSAGE =
  "Request received. This is not a confirmed booking — the business will review your request and get back to you.";

const RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "Unable to process this request right now. Please try again shortly.";

export async function submitBookingRequest(
  _prev: SubmitBookingState,
  formData: FormData,
): Promise<SubmitBookingState> {
  const operationId = createOperationId();
  const startedAt = Date.now();
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  const input: BookingRequestInput = {
    businessSlug: String(formData.get("businessSlug") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? ""),
    guestCount: String(formData.get("guestCount") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    privacyConsent: formData.get("privacyConsent") === "on",
    companyWebsite: String(formData.get("companyWebsite") ?? ""),
  };

  // Honeypot: pretend success so bots don't retry differently
  if (input.companyWebsite.trim() !== "") {
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  const validated = validateBookingRequest(input);
  if (!validated.ok) {
    return { status: "error", message: validated.error };
  }

  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return { status: "error", message: "Unable to submit this request." };
  }

  const headerStore = await headers();
  const { ip } = getTrustedClientIp(headerStore);
  // Stable bucket when IP is unavailable — still scoped by business via key builders
  const rateLimitIp = ip ?? "unresolved";

  const turnstile = await verifyTurnstileToken(
    turnstileToken,
    ip ?? undefined,
  );
  if (!turnstile.ok) {
    logServerEvent({
      event: "booking.public.submit",
      outcome: "rejected",
      operationId,
      errorCategory: "turnstile",
      durationMs: Date.now() - startedAt,
    });
    return { status: "error", message: turnstile.error };
  }

  // Production requires HMAC secret before building Redis keys
  if (!getRateLimitHmacSecret()) {
    logServerEvent({
      event: "booking.public.submit",
      outcome: "error",
      operationId,
      errorCategory: "rate_limit_unavailable",
      durationMs: Date.now() - startedAt,
    });
    return { status: "error", message: RATE_LIMIT_UNAVAILABLE_MESSAGE };
  }

  const rate = await assertWithinRateLimit({
    key: buildIpRateLimitKey(validated.data.businessSlug, rateLimitIp),
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.ok) {
    logServerEvent({
      event: "booking.public.submit",
      outcome: rate.reason === "unavailable" ? "error" : "rate_limited",
      operationId,
      errorCategory:
        rate.reason === "unavailable" ? "rate_limit_unavailable" : "rate_limit_ip",
      durationMs: Date.now() - startedAt,
    });
    if (rate.reason === "unavailable") {
      return { status: "error", message: RATE_LIMIT_UNAVAILABLE_MESSAGE };
    }
    return {
      status: "error",
      message: `Too many requests. Please try again in about ${rate.retryAfterSeconds ?? 60} seconds.`,
    };
  }

  const emailRate = await assertWithinRateLimit({
    key: buildEmailRateLimitKey(
      validated.data.businessSlug,
      validated.data.customerEmail,
    ),
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailRate.ok) {
    logServerEvent({
      event: "booking.public.submit",
      outcome: emailRate.reason === "unavailable" ? "error" : "rate_limited",
      operationId,
      errorCategory:
        emailRate.reason === "unavailable"
          ? "rate_limit_unavailable"
          : "rate_limit_email",
      durationMs: Date.now() - startedAt,
    });
    if (emailRate.reason === "unavailable") {
      return { status: "error", message: RATE_LIMIT_UNAVAILABLE_MESSAGE };
    }
    return {
      status: "error",
      message: "Too many requests from this email. Please try again later.",
    };
  }

  const page = await getPublicBookingPage(validated.data.businessSlug);
  if (!page) {
    return { status: "error", message: "This business is not accepting requests." };
  }

  if (
    page.settings.booking_mode === "external" ||
    page.services.length === 0
  ) {
    return {
      status: "error",
      message: "Meridian booking requests are not enabled for this business.",
    };
  }

  const service = page.services.find(
    (item) => item.id === validated.data.serviceId,
  );
  if (!service) {
    return { status: "error", message: "Please select a valid service." };
  }

  const supabase = createServiceRoleClient();

  // Idempotent replay: same key for this business returns existing success
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("business_id", page.business.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    logServerEvent({
      event: "booking.public.submit",
      outcome: "success",
      operationId,
      businessId: page.business.id,
      errorCategory: "idempotent_replay",
      durationMs: Date.now() - startedAt,
    });
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      business_id: page.business.id,
      service_id: service.id,
      customer_name: validated.data.customerName,
      customer_email: validated.data.customerEmail,
      customer_phone: validated.data.customerPhone,
      preferred_date: validated.data.preferredDate,
      preferred_time: validated.data.preferredTime,
      guest_count: validated.data.guestCount,
      notes: validated.data.notes,
      status: "pending",
      privacy_consent_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (bookingError) {
    // Unique race on idempotency key — treat as success
    if (bookingError.code === "23505") {
      logServerEvent({
        event: "booking.public.submit",
        outcome: "success",
        operationId,
        businessId: page.business.id,
        errorCategory: "idempotent_race",
        durationMs: Date.now() - startedAt,
      });
      return { status: "success", message: SUCCESS_MESSAGE };
    }
    logServerEvent({
      event: "booking.public.submit",
      outcome: "error",
      operationId,
      businessId: page.business.id,
      errorCategory: "booking_insert",
      durationMs: Date.now() - startedAt,
    });
    return {
      status: "error",
      message: "We couldn't save your request. Please try again.",
    };
  }

  if (!booking) {
    return {
      status: "error",
      message: "We couldn't save your request. Please try again.",
    };
  }

  const { error: eventError } = await supabase.from("booking_events").insert({
    business_id: page.business.id,
    booking_id: booking.id,
    event_type: "booking.created",
    payload: {
      source: "public_form",
      service_id: service.id,
      preferred_date: validated.data.preferredDate,
      preferred_time: validated.data.preferredTime,
      // Do not include customer notes/allergies/PII in event payloads
    },
  });

  if (eventError) {
    logServerEvent({
      event: "booking.event.insert",
      outcome: "error",
      operationId,
      businessId: page.business.id,
      errorCategory: "booking_event_insert",
      durationMs: Date.now() - startedAt,
    });
  }

  try {
    await sendBookingRequestEmails({
      businessId: page.business.id,
      bookingId: booking.id,
      businessName: page.business.name,
      notificationEmail: page.settings.notification_email,
      customerName: validated.data.customerName,
      customerEmail: validated.data.customerEmail,
      customerPhone: validated.data.customerPhone,
      serviceName: service.name,
      preferredDate: validated.data.preferredDate,
      preferredTime: validated.data.preferredTime,
      guestCount: validated.data.guestCount,
      notes: validated.data.notes,
    });
  } catch {
    logServerEvent({
      event: "booking.email.send",
      outcome: "error",
      operationId,
      businessId: page.business.id,
      errorCategory: "email_send",
      durationMs: Date.now() - startedAt,
    });
  }

  logServerEvent({
    event: "booking.public.submit",
    outcome: "success",
    operationId,
    businessId: page.business.id,
    durationMs: Date.now() - startedAt,
  });

  return { status: "success", message: SUCCESS_MESSAGE };
}
