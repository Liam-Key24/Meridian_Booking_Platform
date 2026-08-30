import "server-only";

import { brandingFromSiteSettings } from "@/lib/templates/branding";
import type { DashboardMode } from "@/lib/business/modes";
import { createClient } from "@/lib/supabase/server";
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

function parseSections(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function listActiveTemplates(
  dashboardMode?: DashboardMode,
): Promise<SiteTemplate[]> {
  const supabase = await createClient();
  let query = supabase
    .from("site_templates")
    .select(
      "id, name, slug, status, dashboard_mode, allowed_sections, description",
    )
    .eq("status", "active")
    .order("name");

  if (dashboardMode) {
    query = query.eq("dashboard_mode", dashboardMode);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[templates] listActiveTemplates", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    allowed_sections: parseSections(row.allowed_sections),
  }));
}

/**
 * Safe preview payload: only when the business has an assigned template
 * that is currently active. No publish without assignment.
 */
export async function getBusinessTemplatePreview(businessSlug: string): Promise<{
  businessName: string;
  businessSlug: string;
  dashboardMode: DashboardMode;
  template: SiteTemplate;
  branding: ReturnType<typeof brandingFromSiteSettings>;
} | null> {
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status, dashboard_mode")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) return null;

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | null) ?? "hospitality";

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

  if (template.dashboard_mode && template.dashboard_mode !== dashboardMode) {
    return null;
  }

  const { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select(
      "primary_color, accent_color, background_color, text_color, logo_path, favicon_path, hero_image_path, heading_font_path, body_font_path, gallery_paths, menu_json, menu_pdfs_json, section_copy_json, template_config_version",
    )
    .eq("business_id", business.id)
    .maybeSingle();

  return {
    businessName: business.name,
    businessSlug: business.slug,
    dashboardMode,
    template: {
      ...template,
      allowed_sections: parseSections(template.allowed_sections),
    },
    branding: brandingFromSiteSettings(siteSettings),
  };
}
