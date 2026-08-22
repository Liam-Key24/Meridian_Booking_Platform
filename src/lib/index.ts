/**
 * Shared library helpers.
 * Prefer importing from specific modules (e.g. `@/lib/supabase/server`)
 * rather than this barrel — especially never pull admin/service-role via a
 * shared client entrypoint.
 */
export { cn } from "./cn";
