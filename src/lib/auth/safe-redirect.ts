const DEFAULT_BUSINESS_HOME = "/dashboard";
const DEFAULT_ADMIN_HOME = "/admin";

/**
 * Accept only safe internal paths for post-login redirects.
 * Rejects absolute URLs, protocol-relative URLs, and encoded variants of either.
 */
export function getSafeRedirectPath(
  raw: unknown,
  fallback: string = DEFAULT_BUSINESS_HOME,
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
  return isMeridianAdmin ? DEFAULT_ADMIN_HOME : DEFAULT_BUSINESS_HOME;
}

/**
 * Resolve post-login destination from a raw `next` value and server-known role.
 * Meridian admins without a business membership are never stranded on /dashboard.
 */
export function resolvePostLoginDestination(options: {
  next: unknown;
  isMeridianAdmin: boolean;
  hasBusinessMembership: boolean;
}): string {
  const defaultHome = getDefaultPostLoginPath(options.isMeridianAdmin);
  const candidate = getSafeRedirectPath(options.next, defaultHome);

  const wantsDashboard =
    candidate === "/dashboard" || candidate.startsWith("/dashboard/");

  if (
    wantsDashboard &&
    options.isMeridianAdmin &&
    !options.hasBusinessMembership
  ) {
    return DEFAULT_ADMIN_HOME;
  }

  return candidate;
}

/** @deprecated Prefer resolvePostLoginDestination with role context. */
export function resolvePostLoginPath(next: unknown): string {
  return getSafeRedirectPath(next);
}
