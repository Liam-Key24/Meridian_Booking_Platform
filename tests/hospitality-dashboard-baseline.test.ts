import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultBarHours,
  defaultKitchenCloseTimes,
  defaultWeeklyHours,
  parseCustomTables,
  todayOpeningLabel,
} from "@/lib/dashboard/hospitality-settings";
import { ALLERGY_CODES, normalizeAllergies } from "@/lib/allergies";
import { niceTableTicks } from "@/lib/dashboard/analytics-math";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

describe("hospitality dashboard baseline protection", () => {
  it("keeps the planned mode folder separation in place", () => {
    for (const dir of ["shared", "hospitality", "appointments"]) {
      const folder = path.join(root, "src/components/dashboard", dir);
      expect(existsSync(folder), `${dir}/ missing`).toBe(true);
      expect(existsSync(path.join(folder, "README.md"))).toBe(true);
    }
  });

  it("preserves hospitality component and lib surfaces on disk", () => {
    const required = [
      "src/components/dashboard/allergy-tags.tsx",
      "src/components/dashboard/business-settings-form.tsx",
      "src/components/dashboard/manual-booking-form.tsx",
      "src/components/dashboard/booking-detail-panel.tsx",
      "src/components/dashboard/booking-calendar.tsx",
      "src/components/dashboard/bookings-explorer.tsx",
      "src/components/dashboard/charts.tsx",
      "src/components/dashboard/dashboard-shell.tsx",
      "src/components/dashboard/metric-card.tsx",
      "src/app/dashboard/page.tsx",
      "src/app/dashboard/layout.tsx",
      "src/app/dashboard/settings/page.tsx",
      "src/app/dashboard/bookings/page.tsx",
      "src/app/dashboard/calendar/page.tsx",
      "src/lib/dashboard/hospitality-settings.ts",
      "src/lib/dashboard/settings-actions.ts",
      "src/lib/dashboard/analytics.ts",
      "src/lib/allergies.ts",
      "docs/hospitality-dashboard-baseline.md",
    ];

    for (const relative of required) {
      expect(existsSync(path.join(root, relative)), relative).toBe(true);
    }
  });

  it("keeps hospitality sidebar navigation labels", () => {
    const nav = readSrc("src/components/dashboard/shared/dashboard-nav.ts");
    expect(nav).toContain('label: "Dashboard"');
    expect(nav).toContain('label: "Bookings"');
    expect(nav).toContain('label: "Calendar"');
    expect(nav).toContain('label: "New booking"');
    const hospitalityBlock = nav.slice(
      nav.indexOf("HOSPITALITY_NAV"),
      nav.indexOf("APPOINTMENTS_NAV"),
    );
    expect(hospitalityBlock).not.toContain('label: "Staff"');
    expect(hospitalityBlock).not.toContain('label: "Services"');
    expect(hospitalityBlock).not.toContain('label: "Availability"');
  });

  it("layout resolves membership label from dashboard mode (defaults hospitality)", () => {
    const layout = readSrc("src/app/dashboard/layout.tsx");
    expect(layout).toContain("membershipLabelForMode");
    expect(layout).toContain("resolveDashboardMode");
    expect(layout).toContain("opening_hours");
    expect(layout).toContain("todayOpeningLabel");
  });

  it("exposes reservations, tables, party size, and allergy UI", () => {
    const detail = readSrc("src/components/dashboard/booking-detail-panel.tsx");
    expect(detail).toMatch(/guest_count|GUEST_OPTIONS|party/i);
    expect(detail).toMatch(/assigned_table|TABLE_OPTIONS|Table/i);
    expect(detail).toMatch(/Allergy|allergies/);

    const manual = readSrc("src/components/dashboard/manual-booking-form.tsx");
    expect(manual).toContain("AllergyEditor");
    expect(manual).toMatch(/guestCount|guest_count|party/i);
    expect(manual).toMatch(/TABLE_OPTIONS|assigned_table|table/i);

    const explorer = readSrc("src/components/dashboard/bookings-explorer.tsx");
    expect(explorer).toMatch(/Table|assigned_table/);
    expect(explorer).toMatch(/guest_count|seats/i);
    expect(explorer).toMatch(/allerg/i);

    const calendar = readSrc("src/components/dashboard/booking-calendar.tsx");
    expect(calendar).toContain("Tables");
    expect(calendar).toMatch(/guest_count|guestsLabel/);
    expect(calendar).toMatch(/allerg/i);
  });

  it("keeps opening hours, kitchen, and bar settings surfaces", () => {
    const form = readSrc("src/components/dashboard/business-settings-form.tsx");
    expect(form).toContain("Table inventory");
    expect(form).toContain("Max party size");
    expect(form).toMatch(/kitchenClose|Kitchen/);
    expect(form).toMatch(/barHours|Bar/);
    expect(form).toMatch(/openingHours|Opening/);

    const settingsPage = readSrc("src/app/dashboard/settings/page.tsx");
    expect(settingsPage).toContain("kitchen_close");
    expect(settingsPage).toContain("bar_hours");
    expect(settingsPage).toContain("opening_hours");
    expect(settingsPage).toContain("tables_2_seat");
    expect(settingsPage).toContain("max_party_size");

    const actions = readSrc("src/lib/dashboard/settings-actions.ts");
    expect(actions).toContain("kitchen_close_enabled");
    expect(actions).toContain("bar_hours_enabled");
    expect(actions).toContain("max_party_size");
    expect(actions).toContain("tables_2_seat");
  });

  it("keeps hospitality analytics entry points and Tables chart label", () => {
    const page = readSrc("src/app/dashboard/page.tsx");
    expect(page).toContain("getDashboardMetrics");
    expect(page).toContain("HospitalityDashboardHome");

    const home = readSrc(
      "src/components/dashboard/hospitality/hospitality-dashboard-home.tsx",
    );
    expect(home).toContain('yAxisLabel="Tables"');
    expect(home).toContain("Pending requests");
    expect(home).toContain("Confirmed today");

    const charts = readSrc("src/components/dashboard/charts.tsx");
    expect(charts).toContain('yAxisLabel = "Tables"');

    const analytics = readSrc("src/lib/dashboard/analytics.ts");
    expect(analytics).toContain("getDashboardMetrics");
    expect(analytics).toContain('from("bookings")');
  });

  it("hospitality settings helpers still parse tables, hours, kitchen, and bar", () => {
    expect(parseCustomTables([{ label: "Booth", seats: 6 }])).toEqual([
      { label: "Booth", seats: 6 },
    ]);
    expect(defaultWeeklyHours().monday?.open).toBe("09:00");
    expect(defaultBarHours().monday?.open).toBe("11:00");
    expect(defaultKitchenCloseTimes().monday).toBe("21:00");
    expect(todayOpeningLabel(defaultWeeklyHours())).toMatch(/Today|Closed/);
  });

  it("allergy helpers still cover EU codes used by hospitality bookings", () => {
    expect(ALLERGY_CODES).toContain("gluten");
    expect(ALLERGY_CODES).toContain("nuts");
    expect(normalizeAllergies(["gluten", "gluten", "nope"])).toEqual(["gluten"]);
    expect(normalizeAllergies([])).toEqual([]);
    const allergyTags = readSrc("src/components/dashboard/allergy-tags.tsx");
    expect(allergyTags).toContain("export function hasAllergies");
    expect(allergyTags).toContain("AllergyEditor");
  });

  it("analytics math still supports table-style tick labels", () => {
    expect(niceTableTicks(0)).toEqual([0, 1]);
    expect(niceTableTicks(5).at(-1)).toBeGreaterThanOrEqual(5);
  });

  it("retains hospitality migrations for tables, allergies, hours, and toggles", () => {
    const migrationsDir = path.join(root, "supabase/migrations");
    const files = readdirSync(migrationsDir);
    for (const name of [
      "20260823000008_booking_assigned_table.sql",
      "20260823000009_booking_allergies.sql",
      "20260823000010_hospitality_booking_settings.sql",
      "20260823000011_hospitality_hours_toggles.sql",
    ]) {
      expect(files).toContain(name);
    }

    const settingsSql = readFileSync(
      path.join(migrationsDir, "20260823000010_hospitality_booking_settings.sql"),
      "utf8",
    );
    expect(settingsSql).toContain("tables_2_seat");
    expect(settingsSql).toContain("max_party_size");
    expect(settingsSql).toContain("opening_hours");
    expect(settingsSql).toContain("kitchen_close_times");
    expect(settingsSql).toContain("bar_opening_hours");
  });
});
