/**
 * Validate external booking provider URLs.
 * Shared by client dashboard settings and Meridian admin settings.
 */
export type ExternalUrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

const BLOCKED_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
]);

export function validateExternalBookingUrl(
  raw: string,
  options?: { allowLocalhost?: boolean },
): ExternalUrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter an external booking URL." };
  }

  const allowLocalhost =
    options?.allowLocalhost ?? process.env.NODE_ENV !== "production";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid https URL." };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (BLOCKED_PROTOCOLS.has(protocol)) {
    return { ok: false, error: "That URL protocol is not allowed." };
  }

  if (protocol === "http:") {
    const host = parsed.hostname.toLowerCase();
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!(allowLocalhost && isLocal)) {
      return {
        ok: false,
        error: "External booking URLs must use https://",
      };
    }
  } else if (protocol !== "https:") {
    return { ok: false, error: "External booking URLs must use https://" };
  }

  if (!parsed.hostname) {
    return { ok: false, error: "Enter a valid https URL." };
  }

  return { ok: true, url: parsed.toString() };
}
