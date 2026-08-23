"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
  sendBookingDeclinedEmail,
  sendBookingSuggestedEmail,
} from "@/lib/booking/decision-emails";
import { getBusinessContext } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

type BookingRow = Tables<"bookings"> & {
  service: Pick<Tables<"services">, "id" | "name" | "duration_minutes"> | null;
};

async function requireMemberContext(businessId: string) {
  const context = await getBusinessContext(businessId);
  if (!context) {
    return { error: "Not authorised for this business." as const, context: null };
  }
  return { error: null, context };
}

async function loadBookingBundle(businessId: string, bookingId: string) {
  const supabase = await createClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, service:services(id, name, duration_minutes)")
    .eq("business_id", businessId)
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return { error: "Booking not found." as const, booking: null, settings: null };
  }

  const { data: settings } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!settings) {
    return {
      error: "Booking settings are missing for this business." as const,
      booking: null,
      settings: null,
    };
  }

  const raw = booking as Tables<"bookings"> & {
    service:
      | Pick<Tables<"services">, "id" | "name" | "duration_minutes">
      | Pick<Tables<"services">, "id" | "name" | "duration_minutes">[]
      | null;
  };
  const service = Array.isArray(raw.service) ? raw.service[0] : raw.service;
  const resolved: BookingRow = {
    ...(raw as Tables<"bookings">),
    service: service ?? null,
  };

  return { error: null, booking: resolved, settings };
}

async function writeHistory(params: {
  businessId: string;
  bookingId: string;
  actorUserId: string;
  eventType: string;
  auditAction: string;
  payload: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const payload = params.payload as Json;

  const { error: eventError } = await supabase.from("booking_events").insert({
    business_id: params.businessId,
    booking_id: params.bookingId,
    event_type: params.eventType,
    actor_user_id: params.actorUserId,
    payload,
  });

  if (eventError) {
    console.error("[booking-actions] event insert", eventError);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    business_id: params.businessId,
    actor_user_id: params.actorUserId,
    action: params.auditAction,
    entity_type: "booking",
    entity_id: params.bookingId,
    metadata: payload,
  });

  if (auditError) {
    console.error("[booking-actions] audit insert", auditError);
  }
}

function revalidateBookingPaths(bookingId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/calendar");
  revalidatePath(`/dashboard/bookings/${bookingId}`);
}

export async function approveBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");

  const { error: authError, context } = await requireMemberContext(businessId);
  if (authError || !context) {
    return { status: "error", message: authError ?? "Not authorised." };
  }

  const loaded = await loadBookingBundle(businessId, bookingId);
  if (loaded.error || !loaded.booking || !loaded.settings) {
    return { status: "error", message: loaded.error ?? "Booking not found." };
  }

  const confirmDate =
    loaded.booking.suggested_date ?? loaded.booking.preferred_date;
  const confirmTime =
    loaded.booking.suggested_time ?? loaded.booking.preferred_time;

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Idempotent: only pending/suggested rows flip to confirmed
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      preferred_date: confirmDate,
      preferred_time: confirmTime,
      confirmed_at: now,
    })
    .eq("id", bookingId)
    .eq("business_id", businessId)
    .in("status", ["pending", "suggested"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[booking-actions] approve", updateError);
    return { status: "error", message: "Could not approve this booking." };
  }

  if (!updated) {
    return {
      status: "error",
      message: "This booking is already confirmed or cannot be approved.",
    };
  }

  await writeHistory({
    businessId,
    bookingId,
    actorUserId: context.user.id,
    eventType: "booking.confirmed",
    auditAction: "booking.approve",
    payload: {
      previous_status: loaded.booking.status,
      preferred_date: confirmDate,
      preferred_time: confirmTime,
    },
  });

  try {
    await sendBookingConfirmedEmail({
      businessId,
      businessName: context.business.name,
      notificationEmail: loaded.settings.notification_email,
      customerName: loaded.booking.customer_name,
      customerEmail: loaded.booking.customer_email,
      serviceName: loaded.booking.service?.name ?? "Booking",
      preferredDate: confirmDate,
      preferredTime: confirmTime,
      timezone: loaded.settings.timezone,
      durationMinutes: loaded.booking.service?.duration_minutes ?? 60,
      bookingId,
    });
  } catch (error) {
    console.error("[booking-actions] confirmation email", error);
  }

  revalidateBookingPaths(bookingId);
  return {
    status: "success",
    message: "Booking confirmed. Customer notification sent when email is configured.",
  };
}

export async function declineBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const { error: authError, context } = await requireMemberContext(businessId);
  if (authError || !context) {
    return { status: "error", message: authError ?? "Not authorised." };
  }

  const loaded = await loadBookingBundle(businessId, bookingId);
  if (loaded.error || !loaded.booking || !loaded.settings) {
    return { status: "error", message: loaded.error ?? "Booking not found." };
  }

  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "declined" })
    .eq("id", bookingId)
    .eq("business_id", businessId)
    .in("status", ["pending", "suggested"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[booking-actions] decline", updateError);
    return { status: "error", message: "Could not decline this booking." };
  }

  if (!updated) {
    return {
      status: "error",
      message: "This booking cannot be declined from its current status.",
    };
  }

  await writeHistory({
    businessId,
    bookingId,
    actorUserId: context.user.id,
    eventType: "booking.declined",
    auditAction: "booking.decline",
    payload: {
      previous_status: loaded.booking.status,
      reason,
    },
  });

  try {
    await sendBookingDeclinedEmail({
      businessId,
      businessName: context.business.name,
      notificationEmail: loaded.settings.notification_email,
      customerName: loaded.booking.customer_name,
      customerEmail: loaded.booking.customer_email,
      serviceName: loaded.booking.service?.name ?? "Booking",
      preferredDate: loaded.booking.preferred_date,
      preferredTime: loaded.booking.preferred_time,
      timezone: loaded.settings.timezone,
      durationMinutes: loaded.booking.service?.duration_minutes ?? 60,
      bookingId,
      reason,
    });
  } catch (error) {
    console.error("[booking-actions] decline email", error);
  }

  revalidateBookingPaths(bookingId);
  return { status: "success", message: "Booking declined." };
}

export async function suggestBookingTime(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const suggestedDate = String(formData.get("suggestedDate") ?? "").trim();
  const suggestedTime = String(formData.get("suggestedTime") ?? "").trim();

  const { error: authError, context } = await requireMemberContext(businessId);
  if (authError || !context) {
    return { status: "error", message: authError ?? "Not authorised." };
  }

  if (!DATE_RE.test(suggestedDate) || !TIME_RE.test(suggestedTime)) {
    return {
      status: "error",
      message: "Enter a valid suggested date and time.",
    };
  }

  const loaded = await loadBookingBundle(businessId, bookingId);
  if (loaded.error || !loaded.booking || !loaded.settings) {
    return { status: "error", message: loaded.error ?? "Booking not found." };
  }

  const normalisedTime =
    suggestedTime.length === 5 ? `${suggestedTime}:00` : suggestedTime;

  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "suggested",
      suggested_date: suggestedDate,
      suggested_time: normalisedTime,
    })
    .eq("id", bookingId)
    .eq("business_id", businessId)
    .in("status", ["pending", "suggested"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[booking-actions] suggest", updateError);
    return { status: "error", message: "Could not suggest another time." };
  }

  if (!updated) {
    return {
      status: "error",
      message: "This booking cannot receive a suggested time in its current status.",
    };
  }

  await writeHistory({
    businessId,
    bookingId,
    actorUserId: context.user.id,
    eventType: "booking.suggested",
    auditAction: "booking.suggest",
    payload: {
      previous_status: loaded.booking.status,
      suggested_date: suggestedDate,
      suggested_time: normalisedTime,
    },
  });

  try {
    await sendBookingSuggestedEmail({
      businessId,
      businessName: context.business.name,
      notificationEmail: loaded.settings.notification_email,
      customerName: loaded.booking.customer_name,
      customerEmail: loaded.booking.customer_email,
      serviceName: loaded.booking.service?.name ?? "Booking",
      preferredDate: loaded.booking.preferred_date,
      preferredTime: loaded.booking.preferred_time,
      timezone: loaded.settings.timezone,
      durationMinutes: loaded.booking.service?.duration_minutes ?? 60,
      bookingId,
      suggestedDate,
      suggestedTime: normalisedTime,
    });
  } catch (error) {
    console.error("[booking-actions] suggest email", error);
  }

  revalidateBookingPaths(bookingId);
  return { status: "success", message: "Alternative time suggested." };
}

export async function cancelBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");

  const { error: authError, context } = await requireMemberContext(businessId);
  if (authError || !context) {
    return { status: "error", message: authError ?? "Not authorised." };
  }

  const loaded = await loadBookingBundle(businessId, bookingId);
  if (loaded.error || !loaded.booking || !loaded.settings) {
    return { status: "error", message: loaded.error ?? "Booking not found." };
  }

  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("business_id", businessId)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[booking-actions] cancel", updateError);
    return { status: "error", message: "Could not cancel this booking." };
  }

  if (!updated) {
    return {
      status: "error",
      message: "Only confirmed bookings can be cancelled.",
    };
  }

  await writeHistory({
    businessId,
    bookingId,
    actorUserId: context.user.id,
    eventType: "booking.cancelled",
    auditAction: "booking.cancel",
    payload: { previous_status: "confirmed" },
  });

  try {
    await sendBookingCancelledEmail({
      businessId,
      businessName: context.business.name,
      notificationEmail: loaded.settings.notification_email,
      customerName: loaded.booking.customer_name,
      customerEmail: loaded.booking.customer_email,
      serviceName: loaded.booking.service?.name ?? "Booking",
      preferredDate: loaded.booking.preferred_date,
      preferredTime: loaded.booking.preferred_time,
      timezone: loaded.settings.timezone,
      durationMinutes: loaded.booking.service?.duration_minutes ?? 60,
      bookingId,
    });
  } catch (error) {
    console.error("[booking-actions] cancel email", error);
  }

  revalidateBookingPaths(bookingId);
  return { status: "success", message: "Booking cancelled." };
}

export async function createManualBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();
  const guestCountRaw = String(formData.get("guestCount") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sendConfirmation = formData.get("sendConfirmation") === "on";

  const { error: authError, context } = await requireMemberContext(businessId);
  if (authError || !context) {
    return { status: "error", message: authError ?? "Not authorised." };
  }

  if (customerName.length < 2) {
    return { status: "error", message: "Enter the customer name." };
  }
  if (!EMAIL_RE.test(customerEmail)) {
    return { status: "error", message: "Enter a valid customer email." };
  }
  if (!DATE_RE.test(preferredDate) || !TIME_RE.test(preferredTime)) {
    return { status: "error", message: "Enter a valid date and time." };
  }
  if (!serviceId) {
    return { status: "error", message: "Select a service." };
  }

  const guestCount = guestCountRaw
    ? Number.parseInt(guestCountRaw, 10)
    : null;
  if (guestCountRaw && (!Number.isFinite(guestCount) || (guestCount ?? 0) < 1)) {
    return { status: "error", message: "Guest count must be at least 1." };
  }

  const normalisedTime =
    preferredTime.length === 5 ? `${preferredTime}:00` : preferredTime;

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    return { status: "error", message: "Select a valid active service." };
  }

  const { data: settings } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!settings) {
    return { status: "error", message: "Booking settings are missing." };
  }

  const now = new Date().toISOString();
  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      business_id: businessId,
      service_id: service.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      preferred_date: preferredDate,
      preferred_time: normalisedTime,
      guest_count: guestCount,
      notes,
      status: "confirmed",
      confirmed_at: now,
      privacy_consent_at: now,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    console.error("[booking-actions] manual insert", insertError);
    return { status: "error", message: "Could not create the booking." };
  }

  await writeHistory({
    businessId,
    bookingId: booking.id,
    actorUserId: context.user.id,
    eventType: "booking.manual_created",
    auditAction: "booking.manual_create",
    payload: {
      service_id: service.id,
      preferred_date: preferredDate,
      preferred_time: normalisedTime,
      source: "dashboard",
    },
  });

  if (sendConfirmation) {
    try {
      await sendBookingConfirmedEmail({
        businessId,
        businessName: context.business.name,
        notificationEmail: settings.notification_email,
        customerName,
        customerEmail,
        serviceName: service.name,
        preferredDate,
        preferredTime: normalisedTime,
        timezone: settings.timezone,
        durationMinutes: service.duration_minutes,
        bookingId: booking.id,
      });
    } catch (error) {
      console.error("[booking-actions] manual confirmation email", error);
    }
  }

  revalidateBookingPaths(booking.id);
  redirect(`/dashboard/bookings/${booking.id}`);
}
