import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isSubscriptionStatus,
  SUBSCRIPTION_STATUSES,
} from "@/lib/business/modes";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

function readMigrations(): string {
  const dir = path.join(root, "supabase/migrations");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(path.join(dir, name), "utf8"))
    .join("\n\n");
}

describe("admin dashboard mode controls", () => {
  it("defines subscription_status as ops metadata with admin-only protection", () => {
    const sql = readMigrations();
    expect(sql).toMatch(/create type public\.subscription_status as enum/i);
    expect(sql).toMatch(
      /add column if not exists subscription_status public\.subscription_status/i,
    );
    expect(sql).toMatch(
      /old\.subscription_status is distinct from new\.subscription_status/i,
    );
    expect(sql).not.toMatch(/create table public\.payments\b/i);
    expect(sql).not.toMatch(/\bstripe_/i);
  });

  it("exposes subscription status helpers", () => {
    expect(SUBSCRIPTION_STATUSES).toEqual([
      "trial",
      "active",
      "past_due",
      "cancelled",
      "none",
    ]);
    expect(isSubscriptionStatus("active")).toBe(true);
    expect(isSubscriptionStatus("paid")).toBe(false);
  });

  it("admin list shows type, mode, and subscription", () => {
    const page = readSrc("src/app/admin/page.tsx");
    expect(page).toContain("AdminBusinessesList");
    expect(page).toContain("dashboard_mode");
    expect(page).toContain("subscription_status");
    expect(page).toContain("business_type");

    const list = readSrc("src/components/admin/admin-businesses-list.tsx");
    expect(list).toContain("DASHBOARD_MODE_LABELS");
    expect(list).toContain("SUBSCRIPTION_STATUS_LABELS");
    expect(list).toContain("AdminDataTable");
  });

  it("admin detail exposes metrics, capabilities, subscription, and audit", () => {
    const page = readSrc("src/app/admin/businesses/[id]/page.tsx");
    expect(page).toContain("getAdminBusinessOpsMetrics");
    expect(page).toContain("listBusinessAuditHistory");
    expect(page).toContain("BusinessCapabilitiesForm");
    expect(page).toContain("BusinessSubscriptionForm");
    expect(page).toContain("No customer contact details shown here");
    expect(page).toContain("Live metrics");
    expect(page).toContain("MetricCard");
  });

  it("admin actions require admin auth, validate input, and write audit logs", () => {
    const actions = readSrc("src/lib/admin/actions.ts");
    expect(actions).toContain("updateBusinessSubscription");
    expect(actions).toContain("updateBusinessCapabilities");
    expect(actions).toContain("requireAdminActor");
    expect(actions).toContain("admin.business.update_subscription");
    expect(actions).toContain("admin.capabilities.update");
    expect(actions).toContain("isSubscriptionStatus");
    expect(actions).toContain('message: "Subscription status updated."');
    expect(actions).toContain('message: "Capabilities updated."');
  });

  it("ops metrics avoid selecting recipient emails", () => {
    const ops = readSrc("src/lib/admin/business-ops.ts");
    expect(ops).toContain('select("status, created_at")');
    expect(ops).not.toContain("recipient_email");
    expect(ops).toContain("summariseMetadata");
  });
});
