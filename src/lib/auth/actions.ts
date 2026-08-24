"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  GENERIC_AUTH_ERROR,
  validateLoginCredentials,
} from "@/lib/auth/login-validation";
import { resolvePostLoginPath } from "@/lib/auth/safe-redirect";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMeridianAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle();
    isMeridianAdmin = profile?.platform_role === "meridian_admin";
  }

  redirect(resolvePostLoginPath(formData.get("next"), { isMeridianAdmin }));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
