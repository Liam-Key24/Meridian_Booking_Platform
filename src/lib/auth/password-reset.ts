/**
 * Password reset via Supabase Auth (email link → update password).
 * Keep this true only while `/login/forgot-password` and update flow are wired.
 */
export const PASSWORD_RESET_AVAILABLE = true;

export const PASSWORD_RESET_HREF = "/login/forgot-password";
export const UPDATE_PASSWORD_HREF = "/login/update-password";

export function isPasswordResetAvailable(): boolean {
  return PASSWORD_RESET_AVAILABLE;
}

/** Absolute origin for Auth email redirects. */
export function getAuthEmailRedirectOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
