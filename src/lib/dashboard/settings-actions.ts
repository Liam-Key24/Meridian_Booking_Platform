"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/auth/business-context";
import type { BookingMode } from "@/types/database";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const TIMEZONE_RE = /^[A-Za-z_]+\/[A-Za-z0-9_+\-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateBusinessSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notificationEmail = String(
    formData.get("notificationEmail") ?? "",
  ).trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const bookingMode = String(formData.get("bookingMode") ?? "") as BookingMode;
  const externalBookingUrl = String(
    formData.get("externalBookingUrl") ?? "",
  ).trim();

  const context = await getBusinessContext(businessId);
  if (!context) {
    return { status: "error", message: "Not authorised for this business." };
  }

  if (context.role !== "owner" && !context.isMeridianAdmin) {
    return {
      status: "error",
      message: "Only business owners can update settings.",
    };
  }

  if (name.length < 2 || name.length > 120) {
    return { status: "error", message: "Enter a valid business name." };
  }

  if (!EMAIL_RE.test(notificationEmail)) {
    return {
      status: "error",
      message: "Enter a valid notification email address.",
    };
  }

  if (!TIMEZONE_RE.test(timezone)) {
    return {
      status: "error",
      message: "Enter a valid IANA timezone (e.g. Europe/London).",
    };
  }

  if (!["meridian", "external", "hybrid"].includes(bookingMode)) {
    return { status: "error", message: "Choose a valid booking mode." };
  }

  if (bookingMode !== "meridian" && !externalBookingUrl) {
    return {
      status: "error",
      message: "External booking URL is required for external or hybrid mode.",
    };
  }

  const supabase = await createClient();

  const { error: businessError } = await supabase
    .from("businesses")
    .update({ name })
    .eq("id", businessId);

  if (businessError) {
    console.error("[settings] business update", businessError);
    return { status: "error", message: "Could not update business name." };
  }

  const { error: settingsError } = await supabase
    .from("booking_settings")
    .update({
      notification_email: notificationEmail,
      timezone,
      booking_mode: bookingMode,
      external_booking_url:
        bookingMode === "meridian" ? null : externalBookingUrl,
    })
    .eq("business_id", businessId);

  if (settingsError) {
    console.error("[settings] settings update", settingsError);
    return { status: "error", message: "Could not update booking settings." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  revalidatePath(`/book/${context.business.slug}`);

  return { status: "success", message: "Settings saved." };
}
