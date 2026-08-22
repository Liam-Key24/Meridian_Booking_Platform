import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_OWNED_TABLES, RLS_TABLES } from "../src/lib/supabase/constants";

const migrationsDir = join(process.cwd(), "supabase/migrations");

function readMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
    .join("\n\n");
}

describe("multi-tenant schema migrations", () => {
  const sql = readMigrations();

  it("defines every core table", () => {
    for (const table of [
      "businesses",
      "profiles",
      "memberships",
      "booking_settings",
      "services",
      "bookings",
      "booking_events",
      "audit_logs",
    ]) {
      expect(sql).toMatch(new RegExp(`create table public\\.${table}\\b`, "i"));
    }
  });

  it("enables RLS on every client-accessible table", () => {
    for (const table of RLS_TABLES) {
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }
  });

  it("requires business_id on client-owned tables", () => {
    for (const table of CLIENT_OWNED_TABLES) {
      if (table === "businesses") continue;
      const tableBlock = sql.match(
        new RegExp(
          `create table public\\.${table} \\([\\s\\S]*?\\);`,
          "i",
        ),
      );
      expect(tableBlock?.[0], `${table} definition`).toBeTruthy();
      expect(tableBlock?.[0]).toMatch(/business_id uuid/i);
    }
  });

  it("defines the three application roles", () => {
    expect(sql).toMatch(/meridian_admin/);
    expect(sql).toMatch(/business_admin/);
    expect(sql).toMatch(/business_member/);
  });

  it("includes membership-scoped booking select policy", () => {
    expect(sql).toMatch(/create policy "bookings_select_member"/i);
    expect(sql).toMatch(/is_business_member\(business_id\)/i);
  });
});
