import "server-only";

import {
  readActiveBusinessCookie,
  writeActiveBusinessCookie,
  clearActiveBusinessCookie,
} from "@/lib/auth/active-business";
import { isBusinessId } from "@/lib/auth/business-id";
import { createClient } from "@/lib/supabase/server";
import { loadBusinessCapabilities } from "@/lib/business/capabilities-server";
import {
  resolveDashboardMode,
  type CapabilityMap,
  type DashboardMode,
} from "@/lib/business/modes";
import type { MembershipRole, Tables } from "@/types/database";

export type BusinessContext = {
  user: {
    id: string;
    email: string | undefined;
  };
  profile: Tables<"profiles">;
  membership: Tables<"business_memberships">;
  business: Tables<"businesses">;
  role: MembershipRole;
  isMeridianAdmin: boolean;
  /** Server-resolved effective mode — never from the browser. */
  dashboardMode: DashboardMode;
  capabilities: CapabilityMap;
};

export type AuthSnapshot = {
  user: {
    id: string;
    email: string | undefined;
  };
  profile: Tables<"profiles"> | null;
  memberships: Array<{
    membership: Tables<"business_memberships">;
    business: Tables<"businesses">;
  }>;
  isMeridianAdmin: boolean;
};

/**
 * Resolve the authenticated user and all active memberships.
 * Never trusts a client-supplied business_id without membership verification.
 */
export async function getAuthSnapshot(): Promise<AuthSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membershipRows } = await supabase
    .from("business_memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  const memberships: AuthSnapshot["memberships"] = [];

  for (const membership of membershipRows ?? []) {
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", membership.business_id)
      .maybeSingle();

    if (business) {
      memberships.push({ membership, business });
    }
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile ?? null,
    memberships,
    isMeridianAdmin: profile?.platform_role === "meridian_admin",
  };
}

/**
 * Pick the active membership:
 * 1. Explicit businessId argument (verified against memberships)
 * 2. httpOnly active-business cookie (verified)
 * 3. First active membership
 *
 * Never trusts browser-submitted mode. Never uses query-string mode.
 */
async function resolveMembershipMatch(
  snapshot: AuthSnapshot,
  businessId?: string,
): Promise<AuthSnapshot["memberships"][number] | null> {
  if (businessId) {
    if (!isBusinessId(businessId)) return null;
    return (
      snapshot.memberships.find((item) => item.business.id === businessId) ??
      null
    );
  }

  const cookieId = await readActiveBusinessCookie();
  if (cookieId) {
    const fromCookie = snapshot.memberships.find(
      (item) => item.business.id === cookieId,
    );
    if (fromCookie) return fromCookie;
    // Stale cookie (removed membership) — drop it.
    await clearActiveBusinessCookie();
  }

  return snapshot.memberships[0] ?? null;
}

/**
 * Resolve current business context.
 * If businessId is provided, membership is verified server-side.
 * If omitted, the active-business cookie is used when valid, else first membership.
 * Dashboard mode and capabilities come from the business row / capability table.
 */
export async function getBusinessContext(
  businessId?: string,
): Promise<BusinessContext | null> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot || !snapshot.profile) {
    return null;
  }

  const match = await resolveMembershipMatch(snapshot, businessId);
  if (!match) {
    return null;
  }

  // Persist cookie when resolving implicitly so subsequent loads stay stable.
  if (!businessId) {
    const cookieId = await readActiveBusinessCookie();
    if (cookieId !== match.business.id) {
      try {
        await writeActiveBusinessCookie(match.business.id);
      } catch {
        // Server Components may not always allow cookie writes; switch action will.
      }
    }
  }

  const dashboardMode = resolveDashboardMode(match.business);
  const capabilities = await loadBusinessCapabilities(
    match.business.id,
    dashboardMode,
  );

  return {
    user: snapshot.user,
    profile: snapshot.profile,
    membership: match.membership,
    business: match.business,
    role: match.membership.role,
    isMeridianAdmin: snapshot.isMeridianAdmin,
    dashboardMode,
    capabilities,
  };
}

/** Assert membership for a requested business_id — never trust the client alone. */
export async function requireBusinessMembership(
  businessId: string,
): Promise<BusinessContext> {
  const context = await getBusinessContext(businessId);
  if (!context) {
    throw new Error("Not authorised for this business");
  }
  return context;
}
