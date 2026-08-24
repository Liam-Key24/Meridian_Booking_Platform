import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CAPABILITY_KEYS,
  capabilityMapFromKeys,
  capabilityMapFromRows,
  defaultCapabilitiesForMode,
  resolveDashboardMode,
  type CapabilityKey,
  type CapabilityMap,
} from "@/lib/business/modes";
import type { Tables } from "@/types/database";

export type AdminBusinessOpsMetrics = {
  bookingVolume: number;
  confirmedVolume: number;
  cancellationVolume: number;
  noShowVolume: number;
  pendingVolume: number;
  emailSent: number;
  emailFailed: number;
  emailTotal: number;
  lastBookingAt: string | null;
  lastEmailAt: string | null;
  lastAuditAt: string | null;
  lastActivityAt: string | null;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  /** Safe metadata summary — no customer PII. */
  summary: string;
};

function summariseMetadata(action: string, metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return action;
  }
  const record = metadata as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of [
    "status",
    "dashboard_mode",
    "business_type",
    "subscription_status",
    "capability_key",
    "enabled",
    "reset_capabilities",
  ]) {
    if (key in record && record[key] != null) {
      parts.push(`${key}=${String(record[key])}`);
    }
  }
  return parts.length > 0 ? parts.join(", ") : action;
}

export async function getAdminBusinessOpsMetrics(
  businessId: string,
): Promise<{ data: AdminBusinessOpsMetrics | null; error: string | null }> {
  const supabase = await createClient();

  const [
    allBookings,
    confirmed,
    cancelled,
    noShows,
    pending,
    emails,
    latestBooking,
    latestEmail,
    latestAudit,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "cancelled"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "no_show"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending"),
    supabase
      .from("email_delivery_logs")
      .select("status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("bookings")
      .select("updated_at, created_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("email_delivery_logs")
      .select("created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const errors = [
    allBookings.error,
    confirmed.error,
    cancelled.error,
    noShows.error,
    pending.error,
    emails.error,
    latestBooking.error,
    latestEmail.error,
    latestAudit.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("[admin] business ops metrics", errors);
    return { data: null, error: "Could not load operational metrics." };
  }

  const emailRows = emails.data ?? [];
  const emailSent = emailRows.filter((row) => row.status === "sent").length;
  const emailFailed = emailRows.filter((row) => row.status === "failed").length;

  const lastBookingAt =
    latestBooking.data?.updated_at ?? latestBooking.data?.created_at ?? null;
  const lastEmailAt = latestEmail.data?.created_at ?? null;
  const lastAuditAt = latestAudit.data?.created_at ?? null;
  const candidates = [lastBookingAt, lastEmailAt, lastAuditAt].filter(
    Boolean,
  ) as string[];
  const lastActivityAt =
    candidates.length > 0
      ? candidates.sort((a, b) => (a < b ? 1 : -1))[0]!
      : null;

  return {
    data: {
      bookingVolume: allBookings.count ?? 0,
      confirmedVolume: confirmed.count ?? 0,
      cancellationVolume: cancelled.count ?? 0,
      noShowVolume: noShows.count ?? 0,
      pendingVolume: pending.count ?? 0,
      emailSent,
      emailFailed,
      emailTotal: emailRows.length,
      lastBookingAt,
      lastEmailAt,
      lastAuditAt,
      lastActivityAt,
    },
    error: null,
  };
}

export async function listBusinessCapabilitiesForAdmin(
  businessId: string,
  business: Pick<Tables<"businesses">, "dashboard_mode" | "business_type">,
): Promise<CapabilityMap> {
  const mode = resolveDashboardMode(business);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_capabilities")
    .select("capability_key, enabled")
    .eq("business_id", businessId);

  if (error || !data?.length) {
    return capabilityMapFromKeys(defaultCapabilitiesForMode(mode));
  }
  return capabilityMapFromRows(data);
}

export async function listBusinessAuditHistory(
  businessId: string,
  limit = 25,
): Promise<{ data: AdminAuditEntry[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin] audit history", error);
    return { data: [], error: "Could not load audit history." };
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      created_at: row.created_at,
      summary: summariseMetadata(row.action, row.metadata),
    })),
    error: null,
  };
}

export const ADMIN_CAPABILITY_ORDER: CapabilityKey[] = [...CAPABILITY_KEYS];
