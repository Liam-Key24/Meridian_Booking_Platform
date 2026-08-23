const DEFAULT_POST_LOGIN_PATH = "/dashboard";

/**
 * Accept only safe internal paths for post-login redirects.
 * Rejects absolute URLs, protocol-relative URLs, and encoded variants of either.
 */
export function getSafeRedirectPath(
  raw: unknown,
  fallback: string = DEFAULT_POST_LOGIN_PATH,
): string {
  if (typeof raw !== "string") {
    return fallback;
  }

  let value = raw.trim();
  if (!value) {
    return fallback;
  }

  for (let i = 0; i < 4; i += 1) {
    try {
      const decoded = decodeURIComponent(value.replace(/\+/g, " "));
      if (decoded === value) {
        break;
      }
      value = decoded.trim();
    } catch {
      return fallback;
    }
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (
    value.includes("\\") ||
    value.includes("\0") ||
    value.includes("://") ||
    /[\s<>"']/.test(value)
  ) {
    return fallback;
  }

  const pathOnly = value.split(/[?#]/, 1)[0] ?? value;
  if (/^\/[a-zA-Z][a-zA-Z\d+.-]*:/.test(pathOnly)) {
    return fallback;
  }

  return value;
}

export function getDefaultPostLoginPath(): string {
  return DEFAULT_POST_LOGIN_PATH;
}

/**
 * Resolve the post-login destination from a raw `next` value.
 * Admin authorization is never decided here — `/admin` remains a valid
 * internal next so authenticated non-admins still hit the server-side
 * protected-access response.
 */
export function resolvePostLoginPath(next: unknown): string {
  return getSafeRedirectPath(next);
}
