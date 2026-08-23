export type TurnstileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Verify Cloudflare Turnstile token server-side.
 *
 * Local development:
 * - If TURNSTILE_SECRET_KEY is unset, verification is skipped (documented bypass).
 * - Set BOOKING_TURNSTILE_BYPASS=true to force skip even when a secret exists.
 *
 * Production:
 * - When TURNSTILE_SECRET_KEY is set, missing/invalid tokens fail closed.
 * - When unset in production, requests fail closed (Turnstile required).
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const bypass =
    process.env.BOOKING_TURNSTILE_BYPASS === "true" ||
    process.env.BOOKING_TURNSTILE_BYPASS === "1";

  if (bypass && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY missing in production");
      return { ok: false, error: "Unable to verify this request." };
    }
    // Documented local-dev bypass when secret is not configured
    return { ok: true };
  }

  if (!token || token.trim().length < 10) {
    return { ok: false, error: "Unable to verify this request." };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token.trim());
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );

    if (!response.ok) {
      return { ok: false, error: "Unable to verify this request." };
    }

    const data = (await response.json()) as { success?: boolean };
    if (!data.success) {
      return { ok: false, error: "Unable to verify this request." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[turnstile] verification failed", error);
    return { ok: false, error: "Unable to verify this request." };
  }
}
