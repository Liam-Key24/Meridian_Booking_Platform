const DEFAULT_CLIENT_POST_LOGIN_PATH = "/dashboard";
const DEFAULT_ADMIN_POST_LOGIN_PATH = "/admin";

export type PostLoginOptions = {
  isMeridianAdmin?: boolean;
};

/**
 * Accept only safe internal paths for post-login redirects.
 * Rejects absolute URLs, protocol-relative URLs, and encoded variants of either.
 */
export function getSafeRedirectPath(
  raw: unknown,
  fallback: string = DEFAULT_CLIENT_POST_LOGIN_PATH,
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

export function getDefaultPostLoginPath(isMeridianAdmin = false): string {
  return isMeridianAdmin
    ? DEFAULT_ADMIN_POST_LOGIN_PATH
    : DEFAULT_CLIENT_POST_LOGIN_PATH;
}

/**
 * Resolve the post-login destination from a raw `next` value.
 * Explicit safe paths are honored (including deeper `/dashboard/...` routes).
 * Meridian admins without an explicit non-home destination land on `/admin`
 * instead of the client `/dashboard` home.
 */
export function resolvePostLoginPath(
  next: unknown,
  options?: PostLoginOptions,
): string {
  const isMeridianAdmin = options?.isMeridianAdmin === true;
  const fallback = getDefaultPostLoginPath(isMeridianAdmin);
  const safe = getSafeRedirectPath(next, fallback);

  if (isMeridianAdmin && safe === DEFAULT_CLIENT_POST_LOGIN_PATH) {
    return DEFAULT_ADMIN_POST_LOGIN_PATH;
  }

  return safe;
}
