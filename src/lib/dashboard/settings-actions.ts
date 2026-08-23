"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/auth/business-context";
import { validateExternalBookingUrl } from "@/lib/booking/external-url";
import {
  customTablesFromForm,
  holidaysFromForm,
  kitchenCloseFromForm,
  parseNonNegativeInt,
  parseOptionalPositiveInt,
  weeklyHoursFromForm,
} from "@/lib/dashboard/hospitality-settings";
import type { BookingMode, Json } from "@/types/database";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const TIMEZONE_RE = /^[A-Za-z_]+\/[A-Za-z0-9_+\-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\-\s]{7,30}$/;

export async function updateBusinessSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notificationEmail = String(
    formData.get("notificationEmail") ?? "",
  ).trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const bookingMode = String(formData.get("bookingMode") ?? "") as BookingMode;
  const externalBookingUrl = String(
    formData.get("externalBookingUrl") ?? "",
  ).trim();
  const tables2Seat = parseNonNegativeInt(formData.get("tables2Seat"));
  const tables4Seat = parseNonNegativeInt(formData.get("tables4Seat"));
  const tables6Seat = parseNonNegativeInt(formData.get("tables6Seat"));
  const maxBookingsPerDay = parseOptionalPositiveInt(
    formData.get("maxBookingsPerDay"),
  );
  const maxPartySize = parseOptionalPositiveInt(formData.get("maxPartySize"));
  const bookingSlotMinutes = Number(
    String(formData.get("bookingSlotMinutes") ?? "15").trim(),
  );

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
      message: "Enter a valid email address.",
    };
  }

  if (contactPhone && !PHONE_RE.test(contactPhone)) {
    return {
      status: "error",
      message: "Enter a valid phone number.",
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

  let safeExternalUrl: string | null = null;
  if (bookingMode !== "meridian") {
    const validatedUrl = validateExternalBookingUrl(externalBookingUrl);
    if (!validatedUrl.ok) {
      return { status: "error", message: validatedUrl.error };
    }
    safeExternalUrl = validatedUrl.url;
  }

  if (
    Number.isNaN(tables2Seat) ||
    Number.isNaN(tables4Seat) ||
    Number.isNaN(tables6Seat)
  ) {
    return {
      status: "error",
      message: "Table quantities must be whole numbers of 0 or more.",
    };
  }

  if (Number.isNaN(maxBookingsPerDay)) {
    return {
      status: "error",
      message: "Max bookings per day must be a whole number of 1 or more.",
    };
  }

  if (Number.isNaN(maxPartySize)) {
    return {
      status: "error",
      message: "Max party size must be a whole number of 1 or more.",
    };
  }

  if (![15, 30, 60].includes(bookingSlotMinutes)) {
    return {
      status: "error",
      message: "Choose a valid booking slot interval.",
    };
  }

  const customTables = customTablesFromForm(formData);
  if (!customTables) {
    return {
      status: "error",
      message: "Custom tables need a name and seats between 1 and 100.",
    };
  }

  const openingHours = weeklyHoursFromForm(formData, "opening");
  if (!openingHours) {
    return {
      status: "error",
      message: "Check opening times — each open day needs a valid open before close.",
    };
  }

  const barOpeningHours = weeklyHoursFromForm(formData, "bar");
  if (!barOpeningHours) {
    return {
      status: "error",
      message:
        "Check bar opening times — each open day needs a valid open before close.",
    };
  }

  const kitchenCloseTimes = kitchenCloseFromForm(formData);
  if (!kitchenCloseTimes) {
    return {
      status: "error",
      message: "Kitchen close times must use HH:MM format.",
    };
  }

  const holidays = holidaysFromForm(formData);
  if (!holidays) {
    return {
      status: "error",
      message: "Holidays need a valid date (YYYY-MM-DD).",
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
      contact_phone: contactPhone || null,
      timezone,
      booking_mode: bookingMode,
      external_booking_url: safeExternalUrl,
      tables_2_seat: tables2Seat,
      tables_4_seat: tables4Seat,
      tables_6_seat: tables6Seat,
      custom_tables: customTables as unknown as Json,
      opening_hours: openingHours as unknown as Json,
      kitchen_close_times: kitchenCloseTimes as unknown as Json,
      bar_opening_hours: barOpeningHours as unknown as Json,
      holidays: holidays as unknown as Json,
      max_bookings_per_day: maxBookingsPerDay,
      max_party_size: maxPartySize,
      booking_slot_minutes: bookingSlotMinutes,
    })
    .eq("business_id", businessId);

  if (settingsError) {
    console.error("[settings] settings update", settingsError);
    return { status: "error", message: "Could not update booking settings." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/book/${context.business.slug}`);

  return { status: "success", message: "Settings saved." };
}
