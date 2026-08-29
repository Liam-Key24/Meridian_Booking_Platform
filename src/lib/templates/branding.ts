/**
 * Default branding until client_site_settings is available on main.
 * Template renderers should read payload.branding — not hard-coded colours.
 */

export const DEFAULT_CLIENT_SITE_BRANDING = {
  primary_color: "#0F766E",
  accent_color: "#0D9488",
  background_color: "#FFFFFF",
  text_color: "#0F172A",
} as const;

export type ClientSiteBranding = {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  hero_image_url: string | null;
  gallery_urls: string[];
  config_version: number;
};

export function defaultClientSiteBranding(): ClientSiteBranding {
  return {
    ...DEFAULT_CLIENT_SITE_BRANDING,
    logo_url: null,
    hero_image_url: null,
    gallery_urls: [],
    config_version: 0,
  };
}

export function brandingCssVariables(
  branding: ClientSiteBranding,
): Record<string, string> {
  return {
    "--client-primary": branding.primary_color,
    "--client-accent": branding.accent_color,
    "--client-background": branding.background_color,
    "--client-text": branding.text_color,
  };
}
