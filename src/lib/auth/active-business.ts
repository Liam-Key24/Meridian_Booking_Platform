import "server-only";

import { cookies } from "next/headers";
import { isBusinessId } from "@/lib/auth/business-id";

export const ACTIVE_BUSINESS_COOKIE = "meridian_active_business_id";

export { isBusinessId };

/** Read the preferred active business id from an httpOnly cookie (untrusted until membership-checked). */
export async function readActiveBusinessCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ACTIVE_BUSINESS_COOKIE)?.value ?? null;
  return isBusinessId(value) ? value : null;
}

/** Persist active business after server-side membership verification. */
export async function writeActiveBusinessCookie(businessId: string): Promise<void> {
  if (!isBusinessId(businessId)) {
    throw new Error("Invalid business id");
  }
  const store = await cookies();
  store.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function clearActiveBusinessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_BUSINESS_COOKIE);
}
