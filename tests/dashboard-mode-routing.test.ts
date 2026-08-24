import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APPOINTMENTS_NAV,
  HOSPITALITY_NAV,
  filterNavByCapabilities,
  navForDashboardMode,
} from "@/components/dashboard/shared/dashboard-nav";
import {
  capabilityMapFromKeys,
  defaultCapabilitiesForMode,
  resolveDashboardMode,
} from "@/lib/business/modes";
import { isBusinessId } from "@/lib/auth/business-id";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

describe("dashboard mode routing", () => {
  it("ignores URL mode query params on the shared /dashboard home", () => {
    const page = readSrc("src/app/dashboard/page.tsx");
    expect(page).toContain("void params.mode");
    expect(page).toContain("void params.dashboard_mode");
    expect(page).toContain("void params.dashboardMode");
    expect(page).toContain('context.dashboardMode === "appointments"');
    expect(page).not.toMatch(/params\.mode\s*===|searchParams.*dashboardMode/);
  });

  it("layout resolves active business context instead of hard-coding memberships[0] for mode", () => {
    const layout = readSrc("src/app/dashboard/layout.tsx");
    expect(layout).toContain("getBusinessContext()");
    expect(layout).toContain("filterNavByCapabilities");
    expect(layout).toContain("businesses={businesses}");
    expect(layout).toContain("activeBusinessId");
  });

  it("switch action verifies membership and redirects to /dashboard", () => {
    const action = readSrc("src/lib/auth/switch-business.ts");
    expect(action).toContain("writeActiveBusinessCookie");
    expect(action).toContain('redirect("/dashboard")');
    expect(action).toContain("snapshot.memberships.some");
  });

  it("validates business ids before trusting cookie values", () => {
    expect(isBusinessId("not-a-uuid")).toBe(false);
    expect(isBusinessId("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("filters nav by capabilities without inventing mode from the browser", () => {
    const hospitalityCaps = capabilityMapFromKeys(
      defaultCapabilitiesForMode("hospitality"),
    );
    const filtered = filterNavByCapabilities(HOSPITALITY_NAV, hospitalityCaps);
    expect(filtered.map((item) => item.label)).toEqual([
      "Dashboard",
      "Bookings",
      "Calendar",
      "New booking",
    ]);

    const noCalendar = { ...hospitalityCaps, calendar: false };
    expect(
      filterNavByCapabilities(HOSPITALITY_NAV, noCalendar).map((i) => i.label),
    ).toEqual(["Dashboard", "Bookings", "New booking"]);

    const appointmentCaps = capabilityMapFromKeys(
      defaultCapabilitiesForMode("appointments"),
    );
    expect(
      filterNavByCapabilities(APPOINTMENTS_NAV, appointmentCaps).map(
        (i) => i.label,
      ),
    ).toContain("Staff");
    expect(
      filterNavByCapabilities(APPOINTMENTS_NAV, {
        ...appointmentCaps,
        staff: false,
      }).map((i) => i.label),
    ).not.toContain("Staff");
  });

  it("keeps mode resolution server-side from the business row", () => {
    expect(
      resolveDashboardMode({
        business_type: "barber",
        dashboard_mode: "hospitality",
      }),
    ).toBe("hospitality");
    expect(navForDashboardMode("hospitality")).toBe(HOSPITALITY_NAV);
    expect(navForDashboardMode("appointments")).toBe(APPOINTMENTS_NAV);
  });

  it("gates appointments-only routes and shared calendar/bookings by capability", () => {
    expect(readSrc("src/app/dashboard/services/page.tsx")).toContain(
      'requireAppointmentsContext("services")',
    );
    expect(readSrc("src/app/dashboard/staff/page.tsx")).toContain(
      'requireAppointmentsContext("staff")',
    );
    expect(readSrc("src/app/dashboard/availability/page.tsx")).toContain(
      'requireAppointmentsContext("availability")',
    );
    expect(readSrc("src/app/dashboard/calendar/page.tsx")).toContain(
      'requireDashboardCapability("calendar")',
    );
    expect(readSrc("src/app/dashboard/bookings/page.tsx")).toContain(
      'requireDashboardCapability("booking_requests")',
    );
  });
});
