/**
 * Dashboard mode + capability registry.
 * Mode is resolved server-side from the business row — never from the browser.
 */

export const BUSINESS_TYPES = [
  "barber",
  "hairdresser",
  "beauty_salon",
  "tattoo_studio",
  "nail_salon",
  "tanning_studio",
  "restaurant",
  "cafe",
  "pub",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const DASHBOARD_MODES = ["appointments", "hospitality"] as const;

export type DashboardMode = (typeof DASHBOARD_MODES)[number];

export const CAPABILITY_KEYS = [
  "booking_requests",
  "calendar",
  "services",
  "staff",
  "availability",
  "tables",
  "party_size",
  "allergies",
  "opening_hours",
  "kitchen_hours",
  "bar_hours",
  "external_booking_link",
  "email_notifications",
  "analytics",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  barber: "Barber",
  hairdresser: "Hairdresser",
  beauty_salon: "Beauty salon",
  tattoo_studio: "Tattoo studio",
  nail_salon: "Nail salon",
  tanning_studio: "Tanning studio",
  restaurant: "Restaurant",
  cafe: "Café",
  pub: "Pub",
  other: "Other",
};

export const DASHBOARD_MODE_LABELS: Record<DashboardMode, string> = {
  hospitality: "Hospitality",
  appointments: "Appointments",
};

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  booking_requests: "Booking requests",
  calendar: "Calendar",
  services: "Services",
  staff: "Staff",
  availability: "Availability",
  tables: "Tables",
  party_size: "Party size",
  allergies: "Allergies",
  opening_hours: "Opening hours",
  kitchen_hours: "Kitchen hours",
  bar_hours: "Bar hours",
  external_booking_link: "External booking link",
  email_notifications: "Email notifications",
  analytics: "Analytics",
};

const HOSPITALITY_DEFAULT_CAPABILITIES: readonly CapabilityKey[] = [
  "booking_requests",
  "calendar",
  "tables",
  "party_size",
  "allergies",
  "opening_hours",
  "kitchen_hours",
  "bar_hours",
  "analytics",
] as const;

const APPOINTMENTS_DEFAULT_CAPABILITIES: readonly CapabilityKey[] = [
  "booking_requests",
  "calendar",
  "services",
  "staff",
  "availability",
  "external_booking_link",
  "email_notifications",
  "analytics",
] as const;

const APPOINTMENTS_BUSINESS_TYPES = new Set<BusinessType>([
  "barber",
  "hairdresser",
  "beauty_salon",
  "tattoo_studio",
  "nail_salon",
  "tanning_studio",
]);

/** Map business vertical → default dashboard mode. */
export function getDashboardModeForBusinessType(
  businessType: BusinessType,
): DashboardMode {
  if (APPOINTMENTS_BUSINESS_TYPES.has(businessType)) {
    return "appointments";
  }
  // restaurant | cafe | pub | other → hospitality (safe default)
  return "hospitality";
}

export function defaultCapabilitiesForMode(
  mode: DashboardMode,
): readonly CapabilityKey[] {
  return mode === "appointments"
    ? APPOINTMENTS_DEFAULT_CAPABILITIES
    : HOSPITALITY_DEFAULT_CAPABILITIES;
}

export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

export function isDashboardMode(value: string): value is DashboardMode {
  return (DASHBOARD_MODES as readonly string[]).includes(value);
}

export function isCapabilityKey(value: string): value is CapabilityKey {
  return (CAPABILITY_KEYS as readonly string[]).includes(value);
}

/** Resolve effective mode from a business row. Defaults to hospitality. */
export function resolveDashboardMode(input: {
  dashboard_mode?: string | null;
  business_type?: string | null;
}): DashboardMode {
  if (input.dashboard_mode && isDashboardMode(input.dashboard_mode)) {
    return input.dashboard_mode;
  }
  if (input.business_type && isBusinessType(input.business_type)) {
    return getDashboardModeForBusinessType(input.business_type);
  }
  return "hospitality";
}

export function membershipLabelForMode(mode: DashboardMode): string {
  return DASHBOARD_MODE_LABELS[mode];
}

export type CapabilityMap = Record<CapabilityKey, boolean>;

export function emptyCapabilityMap(enabled = false): CapabilityMap {
  return Object.fromEntries(
    CAPABILITY_KEYS.map((key) => [key, enabled]),
  ) as CapabilityMap;
}

export function capabilityMapFromKeys(
  enabledKeys: readonly CapabilityKey[],
): CapabilityMap {
  const map = emptyCapabilityMap(false);
  for (const key of enabledKeys) {
    map[key] = true;
  }
  return map;
}

export function capabilityMapFromRows(
  rows: Array<{ capability_key: string; enabled: boolean }>,
): CapabilityMap {
  const map = emptyCapabilityMap(false);
  for (const row of rows) {
    if (isCapabilityKey(row.capability_key)) {
      map[row.capability_key] = row.enabled;
    }
  }
  return map;
}

export function hasCapability(
  capabilities: CapabilityMap | null | undefined,
  key: CapabilityKey,
): boolean {
  return Boolean(capabilities?.[key]);
}
