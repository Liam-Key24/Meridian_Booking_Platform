import type { ComponentType } from "react";
import { HospitalityClassicLayout } from "@/components/client-site/layouts/hospitality-classic";
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

const PENDING_LAYOUTS = CLIENT_SITE_TEMPLATE_SLUGS.filter(
  (slug) => slug !== "hospitality-classic",
);

/**
 * Slug → layout component. Replace pending entries one commit at a time
 * (see docs/client-site-templates.md).
 */
export const TEMPLATE_LAYOUTS: Record<
  ClientSiteTemplateSlug,
  ComponentType<ClientSiteLayoutProps>
> = {
  "hospitality-classic": HospitalityClassicLayout,
  ...Object.fromEntries(
    PENDING_LAYOUTS.map((slug) => [slug, TemplatePendingShell]),
  ),
} as Record<ClientSiteTemplateSlug, ComponentType<ClientSiteLayoutProps>>;

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
