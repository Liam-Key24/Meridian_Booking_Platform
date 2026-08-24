import "server-only";

import { redirect } from "next/navigation";
import {
  getAuthSnapshot,
  getBusinessContext,
  type BusinessContext,
} from "@/lib/auth/business-context";
import {
  hasCapability,
  type CapabilityKey,
} from "@/lib/business/modes";

/**
 * Require an authenticated dashboard membership.
 * Optional businessId must be a real membership — never trust mode from the URL.
 */
export async function requireDashboardContext(
  businessId?: string,
): Promise<BusinessContext | null> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login?next=/dashboard");
  }

  // Ignore any client attempt to pass mode via query — only business id is optional.
  return getBusinessContext(businessId);
}

/** Redirect home when a required capability is disabled for the active business. */
export async function requireDashboardCapability(
  key: CapabilityKey,
  businessId?: string,
): Promise<BusinessContext> {
  const context = await requireDashboardContext(businessId);
  if (!context) {
    redirect("/login?next=/dashboard");
  }
  if (!hasCapability(context.capabilities, key)) {
    redirect("/dashboard");
  }
  return context;
}
