import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/lib/format/datetime";

describe("formatDateTime", () => {
  it("formats with a stable en-GB pattern", () => {
    const formatted = formatDateTime("2026-08-24T16:54:22.000Z");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/);
  });

  it("returns a dash for invalid values", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});
