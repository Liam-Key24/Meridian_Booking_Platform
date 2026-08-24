import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CAPABILITY_KEYS,
  type CapabilityKey,
  defaultCapabilitiesForType,
  type BusinessType,
} from "@/lib/business/capabilities";

export type CapabilityMap = Record<CapabilityKey, boolean>;

export async function getBusinessCapabilities(
  businessId: string,
): Promise<CapabilityMap> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_capabilities")
    .select("capability, enabled")
    .eq("business_id", businessId);

  const map = Object.fromEntries(
    CAPABILITY_KEYS.map((key) => [key, false]),
  ) as CapabilityMap;

  for (const row of data ?? []) {
    const key = row.capability as CapabilityKey;
    if (CAPABILITY_KEYS.includes(key)) {
      map[key] = Boolean(row.enabled);
    }
  }

  return map;
}

export function businessHasCapability(
  capabilities: CapabilityMap,
  key: CapabilityKey,
): boolean {
  return capabilities[key] === true;
}

/** Seed default capability rows for a new business (admin path). */
export async function seedDefaultCapabilities(
  businessId: string,
  type: BusinessType,
): Promise<void> {
  const supabase = await createClient();
  const defaults = defaultCapabilitiesForType(type);
  const rows = CAPABILITY_KEYS.map((capability) => ({
    business_id: businessId,
    capability,
    enabled: defaults[capability],
  }));

  await supabase.from("business_capabilities").upsert(rows, {
    onConflict: "business_id,capability",
  });
}

export type CapabilityDisableWarning = {
  capability: CapabilityKey;
  warning: string;
  existingCount: number;
};

/**
 * Warn before disabling a capability that already has related records.
 * Never deletes data when a capability is turned off.
 */
export async function getCapabilityDisableWarnings(
  businessId: string,
  disabling: CapabilityKey[],
): Promise<CapabilityDisableWarning[]> {
  if (disabling.length === 0) return [];

  const supabase = await createClient();
  const warnings: CapabilityDisableWarning[] = [];

  for (const capability of disabling) {
    if (capability === "allergy_notes") {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .not("allergies", "eq", "{}");
      if ((count ?? 0) > 0) {
        warnings.push({
          capability,
          existingCount: count ?? 0,
          warning:
            "Allergy notes already exist on bookings. Disabling hides them in the UI but does not delete data.",
        });
      }
    }

    if (capability === "table_management") {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .not("assigned_table", "is", null);
      if ((count ?? 0) > 0) {
        warnings.push({
          capability,
          existingCount: count ?? 0,
          warning:
            "Assigned tables already exist on bookings. Disabling hides table fields but does not delete data.",
        });
      }
    }

    if (capability === "staff_assignment") {
      const { count } = await supabase
        .from("business_staff")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);
      if ((count ?? 0) > 0) {
        warnings.push({
          capability,
          existingCount: count ?? 0,
          warning:
            "Staff records exist. Disabling hides staff UI but does not delete data.",
        });
      }
    }
  }

  return warnings;
}
