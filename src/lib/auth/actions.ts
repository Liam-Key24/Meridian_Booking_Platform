"use server";

import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  GENERIC_AUTH_ERROR,
  validateLoginCredentials,
} from "@/lib/auth/login-validation";
import {
  getAuthEmailRedirectOrigin,
  UPDATE_PASSWORD_HREF,
} from "@/lib/auth/password-reset";
import { resolvePostLoginDestination } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  field?: "email" | "password" | "form" | null;
  success?: string | null;
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESET_SENT =
  "If an account exists for that email, you will receive reset instructions shortly.";

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email address.", field: "email" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address.", field: "email" };
  }

  const supabase = await createClient();
  const redirectTo = `${getAuthEmailRedirectOrigin()}/auth/callback?next=${encodeURIComponent(UPDATE_PASSWORD_HREF)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[auth] password reset request failed", error.message);
  }

  // Always succeed from the client’s perspective — no account enumeration.
  return { error: null, field: null, success: GENERIC_RESET_SENT };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return {
      error: "Use a password with at least 8 characters.",
      field: "password",
    };
  }

  if (password !== confirm) {
    return {
      error: "Passwords do not match.",
      field: "password",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "This reset link is invalid or has expired. Request a new one.",
      field: "form",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[auth] password update failed", error.message);
    return {
      error:
        "We could not update your password. Try again or request a new link.",
      field: "form",
    };
  }

  const snapshot = await getAuthSnapshot();
  const next = resolvePostLoginDestination({
    next: null,
    isMeridianAdmin: snapshot?.isMeridianAdmin ?? false,
    hasBusinessMembership: (snapshot?.memberships.length ?? 0) > 0,
  });

  redirect(next);
}
