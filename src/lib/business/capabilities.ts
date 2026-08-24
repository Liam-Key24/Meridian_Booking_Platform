/**
 * Compatibility barrel — canonical registry lives in `./modes`.
 * Prefer importing from `@/lib/business/modes` in new code.
 */

export {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  CAPABILITY_KEYS,
  CAPABILITY_LABELS,
  DASHBOARD_MODES,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  capabilityMapFromKeys,
  capabilityMapFromRows,
  defaultCapabilitiesForMode,
  emptyCapabilityMap,
  getDashboardModeForBusinessType,
  hasCapability,
  isBusinessType,
  isCapabilityKey,
  isDashboardMode,
  isSubscriptionStatus,
  membershipLabelForMode,
  resolveDashboardMode,
  type BusinessType,
  type CapabilityKey,
  type CapabilityMap,
  type DashboardMode,
  type SubscriptionStatus,
} from "@/lib/business/modes";

import {
  capabilityMapFromKeys,
  defaultCapabilitiesForMode,
  getDashboardModeForBusinessType,
  type BusinessType,
  type CapabilityMap,
  type DashboardMode,
} from "@/lib/business/modes";

/** @deprecated Prefer getDashboardModeForBusinessType */
export function defaultDashboardModeForType(
  businessType: BusinessType,
): DashboardMode {
  return getDashboardModeForBusinessType(businessType);
}

/** @deprecated Prefer capabilityMapFromKeys(defaultCapabilitiesForMode(...)) */
export function defaultCapabilitiesForType(
  businessType: BusinessType,
): CapabilityMap {
  return capabilityMapFromKeys(
    defaultCapabilitiesForMode(getDashboardModeForBusinessType(businessType)),
  );
}

export function chartBookingNoun(mode: DashboardMode): {
  singular: string;
  plural: string;
} {
  if (mode === "appointments") {
    return { singular: "booking", plural: "bookings" };
  }
  return { singular: "table booking", plural: "table bookings" };
}
