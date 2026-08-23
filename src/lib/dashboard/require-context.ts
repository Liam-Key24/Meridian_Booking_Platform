import "server-only";

import { redirect } from "next/navigation";
import {
  getAuthSnapshot,
  getBusinessContext,
  type BusinessContext,
} from "@/lib/auth/business-context";

export async function requireDashboardContext(
  businessId?: string,
): Promise<BusinessContext | null> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login");
  }

  return getBusinessContext(businessId);
}
