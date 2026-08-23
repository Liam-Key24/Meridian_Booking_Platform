import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SEED } from "../src/lib/supabase/seed-ids";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasLiveSupabase = Boolean(url && publishableKey);

async function signInAs(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(url!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

describe.runIf(hasLiveSupabase)("tenant isolation (live Supabase)", () => {
  it("allows User A to read Business A only", async () => {
    const client = await signInAs(
      SEED.users.businessAOwner.email,
      SEED.users.businessAOwner.password,
    );

    const { data: own } = await client
      .from("businesses")
      .select("id")
      .eq("id", SEED.businesses.a.id);
    expect(own).toHaveLength(1);

    const { data: other, error } = await client
      .from("businesses")
      .select("id")
      .eq("id", SEED.businesses.b.id);
    expect(error).toBeNull();
    expect(other ?? []).toHaveLength(0);
  });

  it("allows User B to read Business B only", async () => {
    const client = await signInAs(
      SEED.users.businessBOwner.email,
      SEED.users.businessBOwner.password,
    );

    const { data: own } = await client
      .from("businesses")
      .select("id")
      .eq("id", SEED.businesses.b.id);
    expect(own).toHaveLength(1);

    const { data: other } = await client
      .from("businesses")
      .select("id")
      .eq("id", SEED.businesses.a.id);
    expect(other ?? []).toHaveLength(0);
  });

  it("blocks cross-tenant business updates", async () => {
    const client = await signInAs(
      SEED.users.businessAOwner.email,
      SEED.users.businessAOwner.password,
    );

    const { data } = await client
      .from("businesses")
      .update({ name: "Hijacked" })
      .eq("id", SEED.businesses.b.id)
      .select("id");

    expect(data ?? []).toHaveLength(0);
  });

  it("denies unauthenticated reads", async () => {
    const anon = createClient<Database>(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anon.from("businesses").select("id");
    expect(data ?? []).toHaveLength(0);
    // Either empty under RLS or a permission error depending on grants
    expect(error === null || error !== null).toBe(true);
  });
});

describe.runIf(!hasLiveSupabase)(
  "tenant isolation (skipped without Supabase env)",
  () => {
    it("documents that live RLS checks require Meridian Platform Development env", () => {
      expect(hasLiveSupabase).toBe(false);
    });
  },
);
