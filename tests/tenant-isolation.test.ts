import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SEED } from "../src/lib/supabase/constants";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasLiveSupabase = Boolean(url && anonKey);

async function signInAs(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  return client;
}

describe.runIf(hasLiveSupabase)(
  "tenant isolation against live Supabase",
  () => {
    it("prevents Aura from reading Harbour bookings", async () => {
      const aura = await signInAs(
        SEED.users.auraAdmin.email,
        SEED.users.auraAdmin.password,
      );

      const { data, error } = await aura
        .from("bookings")
        .select("id, business_id")
        .eq("id", SEED.bookings.harbour);

      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);

      const { data: own } = await aura
        .from("bookings")
        .select("id, business_id")
        .eq("id", SEED.bookings.aura);

      expect(own).toHaveLength(1);
      expect(own?.[0]?.business_id).toBe(SEED.businesses.aura.id);
    });

    it("prevents Harbour from reading Aura bookings", async () => {
      const harbour = await signInAs(
        SEED.users.harbourAdmin.email,
        SEED.users.harbourAdmin.password,
      );

      const { data, error } = await harbour
        .from("bookings")
        .select("id, business_id")
        .eq("id", SEED.bookings.aura);

      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);

      const { data: own } = await harbour
        .from("bookings")
        .select("id, business_id")
        .eq("id", SEED.bookings.harbour);

      expect(own).toHaveLength(1);
      expect(own?.[0]?.business_id).toBe(SEED.businesses.harbour.id);
    });

    it("blocks cross-tenant booking updates", async () => {
      const aura = await signInAs(
        SEED.users.auraAdmin.email,
        SEED.users.auraAdmin.password,
      );

      const { data, error } = await aura
        .from("bookings")
        .update({ notes: "cross-tenant probe" })
        .eq("id", SEED.bookings.harbour)
        .select("id");

      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });
  },
);

describe.runIf(!hasLiveSupabase)(
  "tenant isolation (skipped without Supabase env)",
  () => {
    it("documents that live RLS checks require local/remote Supabase", () => {
      expect(hasLiveSupabase).toBe(false);
    });
  },
);
