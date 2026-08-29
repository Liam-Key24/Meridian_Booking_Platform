import type { ComponentType } from "react";
import { HospitalityClassicLayout } from "@/components/client-site/layouts/hospitality-classic";
import type { ClientSitePagePayload } from "@/lib/templates/payload";

export type ClientSiteLayoutProps = {
  payload: ClientSitePagePayload;
  preview?: boolean;
};

export const TEMPLATE_LAYOUTS: Record<
  string,
  ComponentType<ClientSiteLayoutProps>
> = {
  "hospitality-classic": HospitalityClassicLayout,
};

export const AVAILABLE_TEMPLATE_LAYOUT_SLUGS = new Set(
  Object.keys(TEMPLATE_LAYOUTS),
);

export function resolveClientSiteLayout(slug: string) {
  return TEMPLATE_LAYOUTS[slug] ?? null;
}

export function renderClientSiteLayout(
  payload: ClientSitePagePayload,
  options?: { preview?: boolean },
) {
  const Layout = resolveClientSiteLayout(payload.template.slug);
  if (!Layout) return null;
  return <Layout payload={payload} preview={options?.preview} />;
}
