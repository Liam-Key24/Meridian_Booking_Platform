import { describe, expect, it } from "vitest";
import { matchSearchSuggestions } from "@/lib/dashboard/search-suggestions";

const hospitalityHrefs = [
  "/dashboard",
  "/dashboard/bookings",
  "/dashboard/calendar",
  "/dashboard/bookings/new",
];

const appointmentsHrefs = [
  "/dashboard",
  "/dashboard/bookings",
  "/dashboard/calendar",
  "/dashboard/customers",
  "/dashboard/services",
  "/dashboard/staff",
  "/dashboard/availability",
];

describe("matchSearchSuggestions", () => {
  it("returns curated defaults when the query is empty", () => {
    const hits = matchSearchSuggestions({
      query: "",
      mode: "hospitality",
      allowedHrefs: hospitalityHrefs,
    });
    expect(hits.some((hit) => hit.id === "settings")).toBe(true);
    expect(hits.some((hit) => hit.id === "bookings")).toBe(true);
    expect(hits.every((hit) => !hit.modes || hit.modes.includes("hospitality"))).toBe(
      true,
    );
  });

  it("matches hospitality settings keywords", () => {
    const hours = matchSearchSuggestions({
      query: "hours",
      mode: "hospitality",
      allowedHrefs: hospitalityHrefs,
    });
    expect(hours[0]?.href).toBe("/dashboard/settings");
    expect(hours.some((hit) => hit.id === "settings-hours")).toBe(true);

    const tables = matchSearchSuggestions({
      query: "party",
      mode: "hospitality",
      allowedHrefs: hospitalityHrefs,
    });
    expect(tables.some((hit) => hit.id === "settings-tables")).toBe(true);
  });

  it("matches appointments staff and hides hospitality-only keywords", () => {
    const staff = matchSearchSuggestions({
      query: "staff",
      mode: "appointments",
      allowedHrefs: appointmentsHrefs,
    });
    expect(staff[0]?.href).toBe("/dashboard/staff");

    const tables = matchSearchSuggestions({
      query: "tables",
      mode: "appointments",
      allowedHrefs: appointmentsHrefs,
    });
    expect(tables.every((hit) => hit.id !== "settings-tables")).toBe(true);
  });

  it("hides capability-gated pages when href is not allowed", () => {
    const hits = matchSearchSuggestions({
      query: "staff",
      mode: "appointments",
      allowedHrefs: ["/dashboard", "/dashboard/bookings"],
    });
    expect(hits.every((hit) => hit.href !== "/dashboard/staff")).toBe(true);
  });
});
