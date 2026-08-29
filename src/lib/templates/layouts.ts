import type { ComponentType } from "react";
import { TemplatePendingShell } from "@/components/client-site/template-pending-shell";
import {
  CLIENT_SITE_TEMPLATE_SLUGS,
  type ClientSiteTemplateSlug,
} from "@/lib/templates/catalog";
import type { ClientSitePagePayload } from "@/lib/templates/payload";

export type ClientSiteLayoutProps = {
  payload: ClientSitePagePayload;
  preview?: boolean;
};

/**
 * Slug → layout component. All entries use TemplatePendingShell until
 * real layouts land (see docs/client-site-templates.md).
 */
export const TEMPLATE_LAYOUTS: Record<
  ClientSiteTemplateSlug,
  ComponentType<ClientSiteLayoutProps>
> = Object.fromEntries(
  CLIENT_SITE_TEMPLATE_SLUGS.map((slug) => [slug, TemplatePendingShell]),
) as Record<ClientSiteTemplateSlug, ComponentType<ClientSiteLayoutProps>>;

export function resolveClientSiteLayout(slug: string) {
  if (!(slug in TEMPLATE_LAYOUTS)) return null;
  return TEMPLATE_LAYOUTS[slug as ClientSiteTemplateSlug];
}

export function renderClientSiteLayout(
  payload: ClientSitePagePayload,
  options?: { preview?: boolean },
) {
  const Layout = resolveClientSiteLayout(payload.template.slug);
  if (!Layout) {
    return null;
  }
  return <Layout payload={payload} preview={options?.preview} />;
}
