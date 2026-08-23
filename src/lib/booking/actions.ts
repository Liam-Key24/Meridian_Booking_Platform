"use server";

import { headers } from "next/headers";
import { sendBookingRequestEmails } from "@/lib/booking/emails";
import { getPublicBookingPage } from "@/lib/booking/public-page";
import { assertWithinRateLimit } from "@/lib/booking/rate-limit";
import {
  validateBookingRequest,
  type BookingRequestInput,
} from "@/lib/booking/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type SubmitBookingState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export async function submitBookingRequest(
  _prev: SubmitBookingState,
  formData: FormData,
): Promise<SubmitBookingState> {
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
    return {
      status: "success",
      message:
        "Request received. This is not a confirmed booking — the business will be in touch.",
    };
  }

  const validated = validateBookingRequest(input);
  if (!validated.ok) {
    return { status: "error", message: validated.error };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";

  const rate = assertWithinRateLimit({
    key: `book:${validated.data.businessSlug}:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.ok) {
    return {
      status: "error",
      message: `Too many requests. Please try again in about ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const emailRate = assertWithinRateLimit({
    key: `book-email:${validated.data.businessSlug}:${validated.data.customerEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailRate.ok) {
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

  const service = page.services.find((item) => item.id === validated.data.serviceId);
  if (!service) {
    return { status: "error", message: "Please select a valid service." };
  }

  const supabase = createServiceRoleClient();

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
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("[booking] insert failed", bookingError);
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
    },
  });

  if (eventError) {
    console.error("[booking] event insert failed", eventError);
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
  } catch (error) {
    console.error("[booking] email failed", error);
  }

  return {
    status: "success",
    message:
      "Request received. This is not a confirmed booking — the business will review your request and get back to you.",
  };
}
