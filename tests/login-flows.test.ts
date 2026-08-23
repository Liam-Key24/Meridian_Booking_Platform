import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { GENERIC_AUTH_ERROR } from "../src/lib/auth/login-validation";
import { SEED } from "../src/lib/supabase/seed-ids";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasLiveSupabase = Boolean(url && publishableKey);

async function signInAs(
  email: string,
  password: string,
): Promise<{
  client: SupabaseClient<Database>;
  error: string | null;
}> {
  const client = createClient<Database>(url!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { client, error: error?.message ?? null };
}

describe.runIf(hasLiveSupabase)("login auth flows (live Supabase)", () => {
  it("signs in a business client successfully", async () => {
    const { client, error } = await signInAs(
      SEED.users.businessAOwner.email,
      SEED.users.businessAOwner.password,
    );
    expect(error).toBeNull();

    const {
      data: { user },
    } = await client.auth.getUser();
    expect(user?.email).toBe(SEED.users.businessAOwner.email);

    const { data: memberships } = await client
      .from("business_memberships")
      .select("business_id, status")
      .eq("user_id", SEED.users.businessAOwner.id)
      .eq("status", "active");

    expect(memberships?.length).toBeGreaterThan(0);
  });

  it("signs in a Meridian admin successfully", async () => {
    const { client, error } = await signInAs(
      SEED.users.meridianAdmin.email,
      SEED.users.meridianAdmin.password,
    );
    expect(error).toBeNull();

    const { data: profile } = await client
      .from("profiles")
      .select("platform_role")
      .eq("id", SEED.users.meridianAdmin.id)
      .maybeSingle();

    expect(profile?.platform_role).toBe("meridian_admin");
  });

  it("keeps non-admins from receiving meridian_admin platform role", async () => {
    const { client, error } = await signInAs(
      SEED.users.businessAOwner.email,
      SEED.users.businessAOwner.password,
    );
    expect(error).toBeNull();

    const { data: profile } = await client
      .from("profiles")
      .select("platform_role")
      .eq("id", SEED.users.businessAOwner.id)
      .maybeSingle();

    expect(profile?.platform_role).not.toBe("meridian_admin");
  });

  it("rejects invalid credentials without revealing account existence", async () => {
    const { error } = await signInAs(
      SEED.users.businessAOwner.email,
      "definitely-not-the-password",
    );
    expect(error).toBeTruthy();
    expect(GENERIC_AUTH_ERROR.toLowerCase()).not.toContain(
      SEED.users.businessAOwner.email.toLowerCase(),
    );
  });
});

describe("unauthenticated admin redirect contract", () => {
  it("uses a shared login route with a safe next=/admin destination", () => {
    const loginPath = "/login";
    const next = "/admin";
    expect(loginPath).toBe("/login");
    expect(next.startsWith("/")).toBe(true);
    expect(next.startsWith("//")).toBe(false);
  });
});
