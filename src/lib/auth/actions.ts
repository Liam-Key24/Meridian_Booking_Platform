"use server";

import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  GENERIC_AUTH_ERROR,
  validateLoginCredentials,
} from "@/lib/auth/login-validation";
import { resolvePostLoginDestination } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  field?: "email" | "password" | "form" | null;
};

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateLoginCredentials(
    formData.get("email"),
    formData.get("password"),
  );

  if (!validation.ok) {
    return { error: validation.error, field: validation.field };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validation.email,
    password: validation.password,
  });

  if (error) {
    return { error: GENERIC_AUTH_ERROR, field: "form" };
  }

  const snapshot = await getAuthSnapshot();
  const next = resolvePostLoginDestination({
    next: formData.get("next"),
    isMeridianAdmin: snapshot?.isMeridianAdmin ?? false,
    hasBusinessMembership: (snapshot?.memberships.length ?? 0) > 0,
  });

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
