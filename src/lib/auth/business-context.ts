import "server-only";

import { createClient } from "@/lib/supabase/server";
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
 * Resolve current business context.
 * If businessId is provided (route/query), membership is verified server-side.
 * If omitted, the user's first active membership is used.
 */
export async function getBusinessContext(
  businessId?: string,
): Promise<BusinessContext | null> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot || !snapshot.profile) {
    return null;
  }

  const match = businessId
    ? snapshot.memberships.find((item) => item.business.id === businessId)
    : snapshot.memberships[0];

  if (!match) {
    return null;
  }

  return {
    user: snapshot.user,
    profile: snapshot.profile,
    membership: match.membership,
    business: match.business,
    role: match.membership.role,
    isMeridianAdmin: snapshot.isMeridianAdmin,
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
