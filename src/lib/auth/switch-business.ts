"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAuthSnapshot,
  getBusinessContext,
} from "@/lib/auth/business-context";
import { isBusinessId } from "@/lib/auth/business-id";
import {
  clearActiveBusinessCookie,
  writeActiveBusinessCookie,
} from "@/lib/auth/active-business";

export type SwitchBusinessState = {
  status: "idle" | "error";
  message: string | null;
};

/**
 * Switch the authenticated user's active business context.
 * Membership is verified server-side. Mode is never taken from the client —
 * after redirect, layout/pages resolve mode from the selected business row.
 */
export async function switchActiveBusiness(
  _prev: SwitchBusinessState,
  formData: FormData,
): Promise<SwitchBusinessState> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login?next=/dashboard");
  }

  const businessId = String(formData.get("businessId") ?? "").trim();
  if (!isBusinessId(businessId)) {
    return { status: "error", message: "Choose a valid business." };
  }

  const allowed = snapshot.memberships.some(
    (item) => item.business.id === businessId,
  );
  if (!allowed) {
    return {
      status: "error",
      message: "You do not have access to that business.",
    };
  }

  // Confirm context (and mode/capabilities) can load for this membership.
  const context = await getBusinessContext(businessId);
  if (!context) {
    await clearActiveBusinessCookie();
    return {
      status: "error",
      message: "Could not activate that business.",
    };
  }

  await writeActiveBusinessCookie(businessId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  // Always land on shared home so appointments-only routes cannot stick
  // after switching to a hospitality business (and vice versa).
  redirect("/dashboard");
}
