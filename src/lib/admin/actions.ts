"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";
import { validateExternalBookingUrl } from "@/lib/booking/external-url";
import type {
  BookingMode,
  BusinessStatus,
  Json,
  MembershipRole,
  MembershipStatus,
} from "@/types/database";

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
  if (!EMAIL_RE.test(notificationEmail)) {
    return { status: "error", message: "Enter a valid notification email." };
  }
  if (!TIMEZONE_RE.test(timezone)) {
    return { status: "error", message: "Enter a valid IANA timezone." };
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({ name, slug, status: "active" })
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

  await writeAudit({
    actorUserId: actor.user.id,
    businessId: business.id,
    action: "admin.business.create",
    entityType: "business",
    entityId: business.id,
    metadata: { name, slug },
  });

  revalidatePath("/admin");
  redirect(`/admin/businesses/${business.id}`);
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
  return { status: "success", message: "Settings saved." };
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
  return { status: "success", message: "Service saved." };
}
