/**
 * Password reset is not implemented yet. Keep this false so the login UI
 * never shows a non-functional "Forgot password?" action.
 * Flip to true (and wire a real route) when the reset flow ships.
 */
export const PASSWORD_RESET_AVAILABLE = false;

export const PASSWORD_RESET_HREF = "/login/forgot-password";

export function isPasswordResetAvailable(): boolean {
  return PASSWORD_RESET_AVAILABLE;
}
