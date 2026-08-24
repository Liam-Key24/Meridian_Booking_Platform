/**
 * Allow-listed capability registry.
 * Only Meridian admins may enable/disable capabilities (enforced in RLS + server actions).
 * Business owners cannot grant themselves capabilities.
 */

export const BUSINESS_TYPES = [
  "salon",
  "barber",
  "hairdresser",
  "tattoo",
  "nails",
  "tanning",
  "restaurant",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const DASHBOARD_MODES = ["appointments", "hospitality"] as const;
export type DashboardMode = (typeof DASHBOARD_MODES)[number];

export const CAPABILITY_KEYS = [
  "staff_assignment",
  "table_management",
  "allergy_notes",
  "guest_count",
  "manual_bookings",
  "external_booking",
  "calendar",
  "customer_notes",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  staff_assignment: "Staff assignment",
  table_management: "Table management",
  allergy_notes: "Allergy notes",
  guest_count: "Guest / party count",
  manual_bookings: "Manual bookings",
  external_booking: "External booking URL",
  calendar: "Calendar",
  customer_notes: "Customer notes",
};

export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

export function isDashboardMode(value: string): value is DashboardMode {
  return (DASHBOARD_MODES as readonly string[]).includes(value);
}

export function isCapabilityKey(value: string): value is CapabilityKey {
  return (CAPABILITY_KEYS as readonly string[]).includes(value);
}

/** Default dashboard mode for a business type. */
export function defaultDashboardModeForType(
  type: BusinessType,
): DashboardMode {
  return type === "restaurant" ? "hospitality" : "appointments";
}

/** Default capability enablement for a business type. */
export function defaultCapabilitiesForType(
  type: BusinessType,
): Record<CapabilityKey, boolean> {
  const hospitality = type === "restaurant";
  return {
    staff_assignment: !hospitality,
    table_management: hospitality,
    allergy_notes: hospitality,
    guest_count: true,
    manual_bookings: true,
    external_booking: true,
    calendar: true,
    customer_notes: true,
  };
}

export function membershipLabelForMode(mode: DashboardMode): string {
  return mode === "hospitality" ? "Hospitality" : "Appointments";
}

export function chartBookingNoun(mode: DashboardMode): {
  singular: string;
  plural: string;
  requestPlural: string;
} {
  if (mode === "hospitality") {
    return {
      singular: "table booking",
      plural: "table bookings",
      requestPlural: "table requests",
    };
  }
  return {
    singular: "booking",
    plural: "bookings",
    requestPlural: "booking requests",
  };
}

/** Capabilities that may have existing records when disabled. */
export const CAPABILITY_DATA_WARNINGS: Partial<
  Record<CapabilityKey, string>
> = {
  allergy_notes:
    "Allergy notes already exist on bookings. Disabling hides them in the UI but does not delete data.",
  table_management:
    "Assigned tables already exist on bookings. Disabling hides table fields but does not delete data.",
  staff_assignment:
    "Staff records may exist. Disabling hides staff UI but does not delete data.",
  guest_count:
    "Guest counts already exist on bookings. Disabling hides the field but does not delete data.",
  customer_notes:
    "Customer notes already exist on bookings. Disabling hides the field but does not delete data.",
};
