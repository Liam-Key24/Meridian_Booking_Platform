import "server-only";

import { redirect } from "next/navigation";
import {
  requireDashboardCapability,
  requireDashboardContext,
} from "@/lib/dashboard/require-context";
import type { BusinessContext } from "@/lib/auth/business-context";
import type { CapabilityKey } from "@/lib/business/modes";

/** Appointments-only routes: hospitality tenants are sent back to the home dashboard. */
export async function requireAppointmentsContext(
  capability?: CapabilityKey,
): Promise<BusinessContext> {
  const context = capability
    ? await requireDashboardCapability(capability)
    : await requireDashboardContext();

  if (!context) {
    redirect("/login?next=/dashboard");
  }
  if (context.dashboardMode !== "appointments") {
    redirect("/dashboard");
  }
  return context;
}
