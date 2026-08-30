import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import {
  getPublicBookingPage,
  type PublicBookingPage,
} from "@/lib/booking/public-page";
import type { DashboardMode } from "@/lib/business/modes";
import {
  brandingFromSiteSettings,
  type ClientSiteBranding,
} from "@/lib/templates/branding";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { canPreviewOrPublishTemplate } from "@/lib/templates/publish-rules";
import type { Json } from "@/types/database";

export type SiteTemplate = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "retired";
  dashboard_mode: DashboardMode | null;
  allowed_sections: string[];
  description: string | null;
};

export type ClientSitePagePayload = {
  business: {
    id: string;
    name: string;
    slug: string;
    dashboard_mode: DashboardMode;
  };
  template: SiteTemplate;
  branding: ClientSiteBranding;
  booking: PublicBookingPage;
};

function parseSections(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getClientSitePagePayload(
  businessSlug: string,
): Promise<ClientSitePagePayload | null> {
  noStore();
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status, dashboard_mode")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) return null;

  const booking = await getPublicBookingPage(businessSlug);
  if (!booking) return null;

  const { data: assignment } = await supabase
    .from("business_template_assignments")
    .select("template_id")
    .eq("business_id", business.id)
    .maybeSingle();

  if (!assignment) return null;

  const { data: template } = await supabase
    .from("site_templates")
    .select(
      "id, name, slug, status, dashboard_mode, allowed_sections, description",
    )
    .eq("id", assignment.template_id)
    .eq("status", "active")
    .maybeSingle();

  if (!template) return null;

  if (
    !canPreviewOrPublishTemplate({
      hasAssignment: true,
      templateStatus: template.status,
    })
  ) {
    return null;
  }

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | null) ?? "hospitality";

  if (template.dashboard_mode && template.dashboard_mode !== dashboardMode) {
    return null;
  }

  const { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select(
      "primary_color, accent_color, background_color, text_color, logo_path, hero_image_path, gallery_paths, menu_json, menu_pdfs_json, template_config_version",
    )
    .eq("business_id", business.id)
    .maybeSingle();

  const branding = brandingFromSiteSettings(siteSettings);

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      dashboard_mode: dashboardMode,
    },
    template: {
      ...template,
      allowed_sections: parseSections(template.allowed_sections),
    },
    branding,
    booking,
  };
}
