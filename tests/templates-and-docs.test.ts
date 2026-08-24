import { describe, expect, it } from "vitest";
import {
  canPreviewOrPublishTemplate,
  describeTemplatePublishBlock,
} from "@/lib/templates/publish-rules";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("template publish rules", () => {
  it("blocks preview/publish without assignment", () => {
    const gate = { hasAssignment: false, templateStatus: null };
    expect(canPreviewOrPublishTemplate(gate)).toBe(false);
    expect(describeTemplatePublishBlock(gate)).toMatch(/No template assigned/i);
  });

  it("blocks non-active assigned templates", () => {
    const gate = { hasAssignment: true, templateStatus: "draft" as const };
    expect(canPreviewOrPublishTemplate(gate)).toBe(false);
    expect(describeTemplatePublishBlock(gate)).toMatch(/not active/i);
  });

  it("allows only assigned active templates", () => {
    const gate = { hasAssignment: true, templateStatus: "active" as const };
    expect(canPreviewOrPublishTemplate(gate)).toBe(true);
    expect(describeTemplatePublishBlock(gate)).toBeNull();
  });
});

describe("site templates migration", () => {
  it("defines registry, assignment, and seed templates", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260823000007_site_templates.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("create table public.site_templates");
    expect(sql).toContain("create table public.business_template_assignments");
    expect(sql).toContain("meridian-classic");
    expect(sql).toContain("meridian-minimal");
    expect(sql).toContain("enable row level security");
  });
});

describe("readme alignment", () => {
  it("no longer claims bookings and emails are out of scope", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    expect(readme).toMatch(/Public booking requests/i);
    expect(readme).toMatch(/Resend/i);
    expect(readme).not.toMatch(
      /Out of scope \(later\)\n\nBookings, emails/i,
    );
  });
});
