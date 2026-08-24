import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  APPOINTMENTS_NAV,
  HOSPITALITY_NAV,
  navForDashboardMode,
} from "@/components/dashboard/shared/dashboard-nav";
import { emptyStatusCounts } from "@/lib/dashboard/analytics-math";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

describe("appointments dashboard experience", () => {
  it("keeps appointments components and routes on disk", () => {
    for (const relative of [
      "src/components/dashboard/appointments/appointments-dashboard-home.tsx",
      "src/components/dashboard/appointments/appointments-settings-panel.tsx",
      "src/components/dashboard/hospitality/hospitality-dashboard-home.tsx",
      "src/lib/dashboard/appointments-analytics.ts",
      "src/app/dashboard/customers/page.tsx",
      "src/app/dashboard/services/page.tsx",
      "src/app/dashboard/staff/page.tsx",
      "src/app/dashboard/availability/page.tsx",
      "supabase/migrations/20260824073756_appointments_dashboard_support.sql",
    ]) {
      expect(existsSync(path.join(root, relative)), relative).toBe(true);
    }
  });

  it("uses appointment terminology in the appointments home", () => {
    const home = readSrc(
      "src/components/dashboard/appointments/appointments-dashboard-home.tsx",
    );
    expect(home).toMatch(/Appointment overview|Appointments today/);
    expect(home).toMatch(/Pending requests|Confirmed appointments|No-shows/);
    expect(home).toMatch(/Busiest services|Staff workload|Booking conversion/);
    expect(home).not.toMatch(/\bTables\b|\bcovers\b|\bkitchen\b|\ballergy\b/i);
  });

  it("keeps hospitality home free of appointments-only nav labels", () => {
    const home = readSrc(
      "src/components/dashboard/hospitality/hospitality-dashboard-home.tsx",
    );
    expect(home).toContain("Pending requests");
    expect(home).toContain('yAxisLabel="Tables"');
    expect(home).not.toContain("Appointment overview");
  });

  it("defines distinct sidebars for each mode", () => {
    expect(HOSPITALITY_NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Bookings",
      "Calendar",
      "New booking",
    ]);
    expect(APPOINTMENTS_NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Bookings",
      "Calendar",
      "Customers",
      "Services",
      "Staff",
      "Availability",
    ]);
    expect(navForDashboardMode("hospitality")).toBe(HOSPITALITY_NAV);
    expect(navForDashboardMode("appointments")).toBe(APPOINTMENTS_NAV);
  });

  it("shell and home route resolve mode server-side", () => {
    const layout = readSrc("src/app/dashboard/layout.tsx");
    expect(layout).toContain("navForDashboardMode");
    expect(layout).toContain("getBusinessContext()");
    expect(layout).toContain("dashboardMode={dashboardMode}");

    const page = readSrc("src/app/dashboard/page.tsx");
    expect(page).toContain('context.dashboardMode === "appointments"');
    expect(page).toContain("AppointmentsDashboardHome");
    expect(page).toContain("HospitalityDashboardHome");
  });

  it("tracks no_show in status counts", () => {
    expect(emptyStatusCounts().no_show).toBe(0);
    const migration = readSrc(
      "supabase/migrations/20260824073756_appointments_dashboard_support.sql",
    );
    expect(migration).toContain("no_show");
    expect(migration).toContain("assigned_staff_user_id");
  });
});
