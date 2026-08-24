import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CAPABILITY_KEYS,
  capabilityMapFromKeys,
  capabilityMapFromRows,
  defaultCapabilitiesForMode,
  hasCapability,
  type CapabilityKey,
  type CapabilityMap,
  type DashboardMode,
} from "@/lib/business/modes";
import type { Json } from "@/types/database";

export async function loadBusinessCapabilities(
  businessId: string,
  fallbackMode: DashboardMode = "hospitality",
): Promise<CapabilityMap> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_capabilities")
    .select("capability_key, enabled")
    .eq("business_id", businessId);

  if (error) {
    console.error("[capabilities] load", error);
    return capabilityMapFromKeys(defaultCapabilitiesForMode(fallbackMode));
  }

  if (!data?.length) {
    return capabilityMapFromKeys(defaultCapabilitiesForMode(fallbackMode));
  }

  return capabilityMapFromRows(data);
}

export async function requireCapability(
  businessId: string,
  key: CapabilityKey,
  mode: DashboardMode = "hospitality",
): Promise<CapabilityMap> {
  const capabilities = await loadBusinessCapabilities(businessId, mode);
  if (!hasCapability(capabilities, key)) {
    throw new Error(`Capability disabled: ${key}`);
  }
  return capabilities;
}

/** Seed default capability rows for a business (admin create / mode change). */
export async function seedDefaultCapabilities(params: {
  businessId: string;
  mode: DashboardMode;
  updatedBy: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const keys = defaultCapabilitiesForMode(params.mode);
  const rows = keys.map((capability_key) => ({
    business_id: params.businessId,
    capability_key,
    enabled: true,
    updated_by: params.updatedBy,
  }));

  const { error } = await supabase.from("business_capabilities").upsert(rows, {
    onConflict: "business_id,capability_key",
  });

  if (error) {
    console.error("[capabilities] seed", error);
    return { error: "Could not seed business capabilities." };
  }
  return { error: null };
}

/** Replace enabled set to mode defaults (disables keys not in the default set). */
export async function resetCapabilitiesToModeDefaults(params: {
  businessId: string;
  mode: DashboardMode;
  updatedBy: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const enabled = new Set(defaultCapabilitiesForMode(params.mode));

  const rows = CAPABILITY_KEYS.map((capability_key) => ({
    business_id: params.businessId,
    capability_key,
    enabled: enabled.has(capability_key),
    updated_by: params.updatedBy,
  }));

  const { error } = await supabase.from("business_capabilities").upsert(rows, {
    onConflict: "business_id,capability_key",
  });

  if (error) {
    console.error("[capabilities] reset", error);
    return { error: "Could not update business capabilities." };
  }
  return { error: null };
}

export async function setBusinessCapability(params: {
  businessId: string;
  capabilityKey: CapabilityKey;
  enabled: boolean;
  updatedBy: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("business_capabilities").upsert(
    {
      business_id: params.businessId,
      capability_key: params.capabilityKey,
      enabled: params.enabled,
      updated_by: params.updatedBy,
    },
    { onConflict: "business_id,capability_key" },
  );

  if (error) {
    console.error("[capabilities] set", error);
    return { error: "Could not update capability." };
  }

  await supabase.from("audit_logs").insert({
    business_id: params.businessId,
    actor_user_id: params.updatedBy,
    action: "admin.capability.update",
    entity_type: "business_capability",
    entity_id: params.businessId,
    metadata: {
      capability_key: params.capabilityKey,
      enabled: params.enabled,
    } as Json,
  });

  return { error: null };
}
