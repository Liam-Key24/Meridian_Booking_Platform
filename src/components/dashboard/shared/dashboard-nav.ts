import type { DashboardMode } from "@/lib/business/modes";

export type DashboardNavKey =
  | "dashboard"
  | "bookings"
  | "calendar"
  | "new_booking"
  | "customers"
  | "services"
  | "staff"
  | "availability";

export type DashboardNavDef = {
  key: DashboardNavKey;
  href: string;
  label: string;
};

/** Hospitality sidebar — preserved baseline. */
export const HOSPITALITY_NAV: DashboardNavDef[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "bookings", href: "/dashboard/bookings", label: "Bookings" },
  { key: "calendar", href: "/dashboard/calendar", label: "Calendar" },
  {
    key: "new_booking",
    href: "/dashboard/bookings/new",
    label: "New booking",
  },
];

/** Appointments sidebar — appointment terminology only. */
export const APPOINTMENTS_NAV: DashboardNavDef[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "bookings", href: "/dashboard/bookings", label: "Bookings" },
  { key: "calendar", href: "/dashboard/calendar", label: "Calendar" },
  { key: "customers", href: "/dashboard/customers", label: "Customers" },
  { key: "services", href: "/dashboard/services", label: "Services" },
  { key: "staff", href: "/dashboard/staff", label: "Staff" },
  {
    key: "availability",
    href: "/dashboard/availability",
    label: "Availability",
  },
];

export function navForDashboardMode(mode: DashboardMode): DashboardNavDef[] {
  return mode === "appointments" ? APPOINTMENTS_NAV : HOSPITALITY_NAV;
}

export function pageTitleForPath(
  pathname: string,
  mode: DashboardMode,
): string {
  if (pathname.startsWith("/dashboard/calendar")) return "Calendar";
  if (pathname.startsWith("/dashboard/customers")) return "Customers";
  if (pathname.startsWith("/dashboard/services")) return "Services";
  if (pathname.startsWith("/dashboard/staff")) return "Staff";
  if (pathname.startsWith("/dashboard/availability")) return "Availability";
  if (pathname.startsWith("/dashboard/bookings/new")) {
    return mode === "appointments" ? "New appointment" : "New booking";
  }
  if (pathname.startsWith("/dashboard/bookings/")) {
    return mode === "appointments" ? "Appointment detail" : "Booking detail";
  }
  if (pathname.startsWith("/dashboard/bookings")) return "Bookings";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}
