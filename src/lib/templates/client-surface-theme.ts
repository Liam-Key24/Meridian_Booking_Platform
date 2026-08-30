/** Shared field chrome for client-site embeds (uses --client-* CSS variables). */
export const CLIENT_SURFACE_FIELD =
  "rounded-xl border border-[color-mix(in_srgb,var(--client-text)_15%,transparent)] bg-[var(--client-background)] text-[var(--client-text)] placeholder:text-[color-mix(in_srgb,var(--client-text)_45%,transparent)] transition-[border-color,box-shadow] focus-visible:border-[var(--client-accent)] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--client-accent)_20%,transparent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";

export const CLIENT_SURFACE_FIELD_ERROR =
  "border-[var(--client-accent)]";

export const CLIENT_SURFACE_LABEL = "font-medium text-[var(--client-text)]";

export const CLIENT_SURFACE_ERROR = "text-[var(--client-accent)]";

export const CLIENT_SURFACE_HINT =
  "text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]";

export const CLIENT_SURFACE_MUTED =
  "text-[color-mix(in_srgb,var(--client-text)_60%,transparent)]";

export const CLIENT_SURFACE_PANEL =
  "rounded-xl border border-[color-mix(in_srgb,var(--client-text)_15%,transparent)] bg-[var(--client-background)]";

export type SurfaceTheme = "meridian" | "client";
