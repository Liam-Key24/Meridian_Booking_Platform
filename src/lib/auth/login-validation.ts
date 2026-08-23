export const GENERIC_AUTH_ERROR =
  "We couldn’t sign you in. Check your email and password and try again.";

export type LoginField = "email" | "password" | "form";

export type LoginValidationResult =
  | { ok: true; email: string; password: string }
  | { ok: false; field: LoginField; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client/server login field checks. Email is trimmed; password is never altered.
 * Does not enforce password composition rules (those belong to create/reset flows).
 */
export function validateLoginCredentials(
  emailRaw: unknown,
  passwordRaw: unknown,
): LoginValidationResult {
  const email = String(emailRaw ?? "").trim();
  const password = String(passwordRaw ?? "");

  if (!email) {
    return { ok: false, field: "email", error: "Enter your email address." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      field: "email",
      error: "Enter a valid email address.",
    };
  }

  if (!password) {
    return { ok: false, field: "password", error: "Enter your password." };
  }

  return { ok: true, email, password };
}
