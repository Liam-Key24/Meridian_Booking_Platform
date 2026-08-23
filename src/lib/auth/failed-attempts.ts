import { isPasswordResetAvailable } from "@/lib/auth/password-reset";

export const FAILED_ATTEMPTS_BEFORE_RESET_HINT = 3;

/**
 * Client-only failed-attempt tracking for UX hints.
 * Not an authentication or rate-limiting boundary — server/provider limits remain authoritative.
 */
export function incrementFailedAttempts(current: number): number {
  if (!Number.isFinite(current) || current < 0) {
    return 1;
  }
  return Math.floor(current) + 1;
}

export function resetFailedAttempts(): number {
  return 0;
}

export function shouldShowForgotPassword(
  failedAttempts: number,
  resetAvailable: boolean = isPasswordResetAvailable(),
): boolean {
  return (
    resetAvailable && failedAttempts >= FAILED_ATTEMPTS_BEFORE_RESET_HINT
  );
}
