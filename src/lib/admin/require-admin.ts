import "server-only";

import { redirect } from "next/navigation";
import {
  getAuthSnapshot,
  type AuthSnapshot,
} from "@/lib/auth/business-context";

export type MeridianAdminContext = AuthSnapshot & {
  isMeridianAdmin: true;
};

export async function requireMeridianAdmin(): Promise<MeridianAdminContext> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login?next=/admin");
  }
  if (!snapshot.isMeridianAdmin) {
    redirect("/admin");
  }
  return snapshot as MeridianAdminContext;
}
