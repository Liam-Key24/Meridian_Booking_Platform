import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "supabase/migrations");

function readMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
    .join("\n\n");
}

describe("Phase 1 multi-tenant migrations", () => {
  const sql = readMigrations();

  it("defines businesses, profiles, and business_memberships", () => {
    expect(sql).toMatch(/create table public\.businesses\b/i);
    expect(sql).toMatch(/create table public\.profiles\b/i);
    expect(sql).toMatch(/create table public\.business_memberships\b/i);
  });

  it("uses owner and staff membership roles", () => {
    expect(sql).toMatch(/'owner'/);
    expect(sql).toMatch(/'staff'/);
    expect(sql).toMatch(/meridian_admin/);
  });

  it("enables RLS on Phase 1 tables", () => {
    for (const table of ["businesses", "profiles", "business_memberships"]) {
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }
  });

  it("requires membership checks on businesses select", () => {
    expect(sql).toMatch(/has_active_business_membership/i);
    expect(sql).not.toMatch(
      /create policy "businesses_select_all_authenticated"/i,
    );
  });

  it("keeps Stripe / payment tables out of Phase 1", () => {
    expect(sql).not.toMatch(/create table public\.payment_accounts\b/i);
    expect(sql).not.toMatch(/create table public\.payments\b/i);
    expect(sql).not.toMatch(/create table public\.refunds\b/i);
    expect(sql).not.toMatch(/\bstripe_[a-z_]+\b/i);
  });
});

describe("Phase 4 audit logs", () => {
  const sql = readMigrations();

  it("creates audit_logs with RLS enabled", () => {
    expect(sql).toMatch(/create table public\.audit_logs\b/i);
    expect(sql).toMatch(
      /alter table public\.audit_logs enable row level security/i,
    );
  });

  it("scopes audit log access to owners and meridian admins", () => {
    expect(sql).toMatch(/audit_logs_select_owner_or_admin/);
    expect(sql).toMatch(/is_business_owner\(business_id\)/);
  });
});

describe("Phase 6 admin ops", () => {
  const sql = readMigrations();

  it("grants meridian_admin booking support policies", () => {
    expect(sql).toMatch(/bookings_select_meridian_admin/);
    expect(sql).toMatch(/booking_settings_select_meridian_admin/);
    expect(sql).toMatch(/services_select_meridian_admin/);
  });

  it("creates email_delivery_logs with RLS", () => {
    expect(sql).toMatch(/create table public\.email_delivery_logs\b/i);
    expect(sql).toMatch(
      /alter table public\.email_delivery_logs enable row level security/i,
    );
  });
});
