import "server-only";

import { redirect } from "next/navigation";
import {
  requireDashboardContext,
} from "@/lib/dashboard/require-context";
import type { BusinessContext } from "@/lib/auth/business-context";

/** Appointments-only routes: hospitality tenants are sent back to the home dashboard. */
export async function requireAppointmentsContext(): Promise<BusinessContext> {
  const context = await requireDashboardContext();
  if (!context) {
    redirect("/login?next=/dashboard");
  }
  if (context.dashboardMode !== "appointments") {
    redirect("/dashboard");
  }
  return context;
}
