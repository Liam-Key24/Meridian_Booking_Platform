"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";
import { validateExternalBookingUrl } from "@/lib/booking/external-url";
import { syncSettingsToTemplate } from "@/lib/templates/sync";
import type {
  BookingMode,
  BusinessStatus,
  BusinessType,
  DashboardMode,
  Json,
  MembershipRole,
  MembershipStatus,
  SubscriptionStatus,
} from "@/types/database";
import {
  CAPABILITY_KEYS,
  getDashboardModeForBusinessType,
  isBusinessType,
  isDashboardMode,
  isSubscriptionStatus,
  type CapabilityKey,
} from "@/lib/business/modes";
import {
  resetCapabilitiesToModeDefaults,
  seedDefaultCapabilities,
} from "@/lib/business/capabilities-server";
import {
  customTablesFromForm,
  holidaysFromForm,
  kitchenCloseFromForm,
  parseNonNegativeInt,
  parseOptionalPositiveInt,
  weeklyHoursFromForm,
} from "@/lib/dashboard/hospitality-settings";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIMEZONE_RE = /^[A-Za-z_]+\/[A-Za-z0-9_+\-]+$/;

async function requireAdminActor() {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) {
    return null;
  }
  return snapshot;
}

async function writeAudit(params: {
  actorUserId: string;
  businessId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    business_id: params.businessId ?? null,
    actor_user_id: params.actorUserId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });
}

export async function createBusiness(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const businessTypeRaw = String(formData.get("businessType") ?? "").trim();
  const notificationEmail = String(
    formData.get("notificationEmail") ?? "",
  ).trim();
  const timezone = String(formData.get("timezone") ?? "Europe/London").trim();

  if (name.length < 2 || name.length > 120) {
    return { status: "error", message: "Enter a valid business name." };
  }
  if (!SLUG_RE.test(slug) || slug.length > 64) {
    return {
      status: "error",
      message: "Slug must be lowercase letters, numbers, and hyphens.",
    };
  }
  if (!isBusinessType(businessTypeRaw)) {
    return {
      status: "error",
      message: "Select a business type.",
    };
  }
  const businessType: BusinessType = businessTypeRaw;
  const dashboardMode = getDashboardModeForBusinessType(businessType);
  if (!EMAIL_RE.test(notificationEmail)) {
    return { status: "error", message: "Enter a valid notification email." };
  }
  if (!TIMEZONE_RE.test(timezone)) {
    return { status: "error", message: "Enter a valid IANA timezone." };
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name,
      slug,
      status: "active",
      business_type: businessType,
      dashboard_mode: dashboardMode,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    console.error("[admin] create business", businessError);
    return {
      status: "error",
      message:
        businessError?.code === "23505"
          ? "That slug is already in use."
          : "Could not create business.",
    };
  }

  const { error: settingsError } = await supabase
    .from("booking_settings")
    .insert({
      business_id: business.id,
      notification_email: notificationEmail,
      timezone,
      booking_mode: "meridian",
    });

  if (settingsError) {
    console.error("[admin] create settings", settingsError);
    return {
      status: "error",
      message: "Business created but booking settings failed.",
    };
  }

  const { error: siteSettingsError } = await supabase
    .from("client_site_settings")
    .insert({ business_id: business.id });

  if (siteSettingsError) {
    console.error("[admin] create site settings", siteSettingsError);
    return {
      status: "error",
      message: "Business created but site settings failed.",
    };
  }

  const seed = await seedDefaultCapabilities({
    businessId: business.id,
    mode: dashboardMode,
    updatedBy: actor.user.id,
  });
  if (seed.error) {
    return { status: "error", message: seed.error };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId: business.id,
    action: "admin.business.create",
    entityType: "business",
    entityId: business.id,
    metadata: {
      name,
      slug,
      business_type: businessType,
      dashboard_mode: dashboardMode,
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/businesses/${business.id}/settings/details`);
}

export async function updateBusinessStatus(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const status = String(formData.get("status") ?? "") as BusinessStatus;
  if (!["active", "inactive", "suspended"].includes(status)) {
    return { status: "error", message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ status })
    .eq("id", businessId);

  if (error) {
    return { status: "error", message: "Could not update business status." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.business.update_status",
    entityType: "business",
    entityId: businessId,
    metadata: { status },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { status: "success", message: "Business status updated." };
}

export async function updateBusinessDashboardMode(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const businessTypeRaw = String(formData.get("businessType") ?? "").trim();
  const modeRaw = String(formData.get("dashboardMode") ?? "").trim();
  const resetCapabilities = formData.get("resetCapabilities") === "on";

  if (!businessId) {
    return { status: "error", message: "Missing business id." };
  }
  if (!isBusinessType(businessTypeRaw)) {
    return { status: "error", message: "Select a valid business type." };
  }
  if (!isDashboardMode(modeRaw)) {
    return { status: "error", message: "Select a valid dashboard mode." };
  }

  const businessType: BusinessType = businessTypeRaw;
  const dashboardMode: DashboardMode = modeRaw;

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("businesses")
    .select("business_type, dashboard_mode")
    .eq("id", businessId)
    .maybeSingle();

  const { error } = await supabase
    .from("businesses")
    .update({
      business_type: businessType,
      dashboard_mode: dashboardMode,
    })
    .eq("id", businessId);

  if (error) {
    console.error("[admin] update dashboard mode", error);
    return {
      status: "error",
      message: "Could not update business type or dashboard mode.",
    };
  }

  if (resetCapabilities || previous?.dashboard_mode !== dashboardMode) {
    const reset = await resetCapabilitiesToModeDefaults({
      businessId,
      mode: dashboardMode,
      updatedBy: actor.user.id,
    });
    if (reset.error) {
      return { status: "error", message: reset.error };
    }
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.business.update_dashboard_mode",
    entityType: "business",
    entityId: businessId,
    metadata: {
      previous_business_type: previous?.business_type ?? null,
      previous_dashboard_mode: previous?.dashboard_mode ?? null,
      business_type: businessType,
      dashboard_mode: dashboardMode,
      reset_capabilities:
        resetCapabilities || previous?.dashboard_mode !== dashboardMode,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Business type and dashboard mode updated.",
  };
}

export async function updateBusinessSubscription(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const statusRaw = String(formData.get("subscriptionStatus") ?? "").trim();

  if (!businessId) {
    return { status: "error", message: "Missing business id." };
  }
  if (!isSubscriptionStatus(statusRaw)) {
    return { status: "error", message: "Select a valid subscription status." };
  }
  const subscriptionStatus: SubscriptionStatus = statusRaw;

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("businesses")
    .select("subscription_status")
    .eq("id", businessId)
    .maybeSingle();

  const { error } = await supabase
    .from("businesses")
    .update({ subscription_status: subscriptionStatus })
    .eq("id", businessId);

  if (error) {
    console.error("[admin] update subscription", error);
    return {
      status: "error",
      message: "Could not update subscription status.",
    };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.business.update_subscription",
    entityType: "business",
    entityId: businessId,
    metadata: {
      previous_subscription_status: previous?.subscription_status ?? null,
      subscription_status: subscriptionStatus,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  return {
    status: "success",
    message: "Subscription status updated.",
  };
}

export async function updateBusinessCapabilities(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) {
    return { status: "error", message: "Missing business id." };
  }

  const enabledKeys = new Set<CapabilityKey>();
  for (const key of CAPABILITY_KEYS) {
    if (formData.get(`cap_${key}`) === "on") {
      enabledKeys.add(key);
    }
  }

  const supabase = await createClient();
  const rows = CAPABILITY_KEYS.map((capability_key) => ({
    business_id: businessId,
    capability_key,
    enabled: enabledKeys.has(capability_key),
    updated_by: actor.user.id,
  }));

  const { error } = await supabase.from("business_capabilities").upsert(rows, {
    onConflict: "business_id,capability_key",
  });

  if (error) {
    console.error("[admin] update capabilities", error);
    return { status: "error", message: "Could not update capabilities." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.capabilities.update",
    entityType: "business_capability",
    entityId: businessId,
    metadata: {
      enabled: [...enabledKeys].sort(),
      disabled: CAPABILITY_KEYS.filter((key) => !enabledKeys.has(key)),
    },
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Capabilities updated.",
  };
}

export async function addBusinessMembership(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "staff") as MembershipRole;

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Enter a valid user email." };
  }
  if (!["owner", "staff"].includes(role)) {
    return { status: "error", message: "Choose owner or staff." };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return {
      status: "error",
      message:
        "No profile found for that email. The user must sign up before membership can be added.",
    };
  }

  const { error } = await supabase.from("business_memberships").insert({
    business_id: businessId,
    user_id: profile.id,
    role,
    status: "active",
  });

  if (error) {
    console.error("[admin] add membership", error);
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "That user is already a member of this business."
          : "Could not add membership.",
    };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.membership.add",
    entityType: "business_membership",
    entityId: profile.id,
    metadata: { email, role },
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  return { status: "success", message: "Membership added." };
}

export async function updateBusinessMembership(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const role = String(formData.get("role") ?? "") as MembershipRole;
  const status = String(formData.get("status") ?? "") as MembershipStatus;

  if (!["owner", "staff"].includes(role)) {
    return { status: "error", message: "Invalid role." };
  }
  if (!["active", "inactive"].includes(status)) {
    return { status: "error", message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_memberships")
    .update({ role, status })
    .eq("id", membershipId)
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not update membership." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.membership.update",
    entityType: "business_membership",
    entityId: membershipId,
    metadata: { role, status },
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  return { status: "success", message: "Membership updated." };
}

export async function updateAdminBookingSettings(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const notificationEmail = String(
    formData.get("notificationEmail") ?? "",
  ).trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const bookingMode = String(formData.get("bookingMode") ?? "") as BookingMode;
  const externalBookingUrl = String(
    formData.get("externalBookingUrl") ?? "",
  ).trim();

  if (!EMAIL_RE.test(notificationEmail)) {
    return { status: "error", message: "Enter a valid notification email." };
  }
  if (!TIMEZONE_RE.test(timezone)) {
    return { status: "error", message: "Enter a valid IANA timezone." };
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_settings")
    .update({
      notification_email: notificationEmail,
      timezone,
      booking_mode: bookingMode,
      external_booking_url: safeExternalUrl,
    })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not update booking settings." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.settings.update",
    entityType: "booking_settings",
    entityId: businessId,
    metadata: { bookingMode, timezone },
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  const message = await syncSettingsToTemplate(businessId, "Settings saved.");
  return { status: "success", message };
}

export async function upsertAdminService(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const durationMinutes = Number.parseInt(
    String(formData.get("durationMinutes") ?? "60"),
    10,
  );
  const isActive = formData.get("isActive") === "on";

  if (name.length < 2) {
    return { status: "error", message: "Enter a service name." };
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5) {
    return { status: "error", message: "Duration must be at least 5 minutes." };
  }

  const supabase = await createClient();

  if (serviceId) {
    const { error } = await supabase
      .from("services")
      .update({
        name,
        description,
        duration_minutes: durationMinutes,
        is_active: isActive,
      })
      .eq("id", serviceId)
      .eq("business_id", businessId);

    if (error) {
      return { status: "error", message: "Could not update service." };
    }

    await writeAudit({
      actorUserId: actor.user.id,
      businessId,
      action: "admin.service.update",
      entityType: "service",
      entityId: serviceId,
      metadata: { name, isActive },
    });
  } else {
    const { data, error } = await supabase
      .from("services")
      .insert({
        business_id: businessId,
        name,
        description,
        duration_minutes: durationMinutes,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { status: "error", message: "Could not create service." };
    }

    await writeAudit({
      actorUserId: actor.user.id,
      businessId,
      action: "admin.service.create",
      entityType: "service",
      entityId: data.id,
      metadata: { name },
    });
  }

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}/settings/services`);
  await revalidatePublicBookPath(businessId);
  const message = await syncSettingsToTemplate(businessId, "Service saved.");
  return { status: "success", message };
}

function revalidateBusinessSettings(businessId: string, slug?: string) {
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}/settings`);
  if (slug) {
    revalidatePath(`/admin/businesses/${businessId}/settings/${slug}`);
  }
}

export async function updateBusinessDetails(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notificationEmail = String(
    formData.get("notificationEmail") ?? "",
  ).trim();
  const contactPhone =
    String(formData.get("contactPhone") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (name.length < 2 || name.length > 120) {
    return { status: "error", message: "Enter a valid business name." };
  }
  if (!EMAIL_RE.test(notificationEmail)) {
    return { status: "error", message: "Enter a valid notification email." };
  }
  if (!TIMEZONE_RE.test(timezone)) {
    return { status: "error", message: "Enter a valid IANA timezone." };
  }

  const supabase = await createClient();
  const { error: businessError } = await supabase
    .from("businesses")
    .update({ name })
    .eq("id", businessId);

  if (businessError) {
    return { status: "error", message: "Could not update business name." };
  }

  const { error: settingsError } = await supabase
    .from("booking_settings")
    .update({
      notification_email: notificationEmail,
      contact_phone: contactPhone,
      timezone,
    })
    .eq("business_id", businessId);

  if (settingsError) {
    return { status: "error", message: "Could not update contact details." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.business.update_details",
    entityType: "business",
    entityId: businessId,
    metadata: { name, timezone },
  });

  revalidateBusinessSettings(businessId, "details");
  revalidatePath("/admin");
  await revalidatePublicBookPath(businessId);
  const message = await syncSettingsToTemplate(businessId, "Details saved.");
  return { status: "success", message };
}

export async function updateAdminHospitalityHours(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const kitchenCloseEnabled = formData.get("kitchenCloseEnabled") === "on";
  const barHoursEnabled = formData.get("barHoursEnabled") === "on";
  const openingHours = weeklyHoursFromForm(formData, "opening");
  const barOpeningHours = weeklyHoursFromForm(formData, "bar");
  const kitchenCloseTimes = kitchenCloseFromForm(formData);
  const holidays = holidaysFromForm(formData);

  if (!openingHours) {
    return {
      status: "error",
      message: "Check opening hours — open must be before close.",
    };
  }
  if (!barOpeningHours) {
    return {
      status: "error",
      message: "Check bar hours — open must be before close.",
    };
  }
  if (!kitchenCloseTimes) {
    return { status: "error", message: "Check kitchen close times." };
  }
  if (!holidays) {
    return { status: "error", message: "Check holiday dates (YYYY-MM-DD)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_settings")
    .update({
      opening_hours: openingHours as unknown as Json,
      kitchen_close_enabled: kitchenCloseEnabled,
      kitchen_close_times: kitchenCloseTimes as unknown as Json,
      bar_hours_enabled: barHoursEnabled,
      bar_opening_hours: barOpeningHours as unknown as Json,
      holidays: holidays as unknown as Json,
    })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not save hours." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.settings.update_hours",
    entityType: "booking_settings",
    entityId: businessId,
  });

  revalidateBusinessSettings(businessId, "hours");
  await revalidatePublicBookPath(businessId);
  const message = await syncSettingsToTemplate(businessId, "Hours saved.");
  return { status: "success", message };
}

export async function updateAdminHospitalityTables(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const tables2 = parseNonNegativeInt(formData.get("tables2Seat"), 0);
  const tables4 = parseNonNegativeInt(formData.get("tables4Seat"), 0);
  const tables6 = parseNonNegativeInt(formData.get("tables6Seat"), 0);
  const maxBookings = parseOptionalPositiveInt(
    formData.get("maxBookingsPerDay"),
  );
  const maxParty = parseOptionalPositiveInt(formData.get("maxPartySize"));
  const slotMinutes = Number.parseInt(
    String(formData.get("bookingSlotMinutes") ?? "30"),
    10,
  );
  const customTables = customTablesFromForm(formData);

  if (
    Number.isNaN(tables2) ||
    Number.isNaN(tables4) ||
    Number.isNaN(tables6)
  ) {
    return { status: "error", message: "Table counts must be whole numbers." };
  }
  if (Number.isNaN(maxBookings as number)) {
    return { status: "error", message: "Max bookings per day is invalid." };
  }
  if (Number.isNaN(maxParty as number)) {
    return { status: "error", message: "Max party size is invalid." };
  }
  if (![15, 30, 60].includes(slotMinutes)) {
    return { status: "error", message: "Slot minutes must be 15, 30, or 60." };
  }
  if (!customTables) {
    return {
      status: "error",
      message: "Custom tables need a label and seats (1–100).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_settings")
    .update({
      tables_2_seat: tables2,
      tables_4_seat: tables4,
      tables_6_seat: tables6,
      custom_tables: customTables as unknown as Json,
      max_bookings_per_day: maxBookings,
      max_party_size: maxParty,
      booking_slot_minutes: slotMinutes,
    })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not save tables settings." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.settings.update_tables",
    entityType: "booking_settings",
    entityId: businessId,
  });

  revalidateBusinessSettings(businessId, "tables");
  await revalidatePublicBookPath(businessId);
  const message = await syncSettingsToTemplate(businessId, "Tables saved.");
  return { status: "success", message };
}

async function revalidatePublicBookPath(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .maybeSingle();
  if (data?.slug) {
    revalidatePath(`/book/${data.slug}`);
  }
}
