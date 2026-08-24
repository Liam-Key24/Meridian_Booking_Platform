/** Shared UUID check for business ids (safe for client + server + tests). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBusinessId(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}
