import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

describe("admin list layout", () => {
  it("wraps admin routes in AdminShell with booking search", () => {
    const layout = readSrc("src/app/admin/layout.tsx");
    expect(layout).toContain("AdminShell");
    expect(layout).toContain("accountEmail");

    const shell = readSrc("src/components/admin/admin-shell.tsx");
    expect(shell).toContain(
      'from "@/components/dashboard/booking-search-autocomplete"',
    );
    expect(shell).toContain("BookingSearchAutocomplete");
    expect(shell).toContain("Operations");
    expect(shell).toContain("Logs");
  });

  it("uses shared AdminDataTable list pages for admin lists", () => {
    expect(readSrc("src/app/admin/audit-logs/page.tsx")).toContain(
      "AdminAuditLogsList",
    );
    expect(readSrc("src/app/admin/email-logs/page.tsx")).toContain(
      "AdminEmailLogsList",
    );
    expect(readSrc("src/app/admin/bookings/page.tsx")).toContain(
      "AdminBookingsList",
    );
    expect(readSrc("src/app/admin/page.tsx")).toContain("AdminBusinessesList");

    for (const file of [
      "src/components/admin/admin-audit-logs-list.tsx",
      "src/components/admin/admin-email-logs-list.tsx",
      "src/components/admin/admin-bookings-list.tsx",
      "src/components/admin/admin-businesses-list.tsx",
    ]) {
      const source = readSrc(file);
      expect(source).toContain("AdminDataTable");
      expect(source).toContain("AdminListPage");
      expect(source).not.toContain("max-w-5xl");
    }
  });

  it("keeps list toolbar search on the right", () => {
    const list = readSrc("src/components/admin/admin-list.tsx");
    expect(list).toContain("lg:ml-auto");
    expect(list).toContain("AdminLocalSearch");
    expect(list).toContain("BookingSearchAutocomplete");
  });
});
