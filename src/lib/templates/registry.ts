import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { canPreviewOrPublishTemplate } from "@/lib/templates/publish-rules";
import type { Json } from "@/types/database";

export type SiteTemplate = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "retired";
  allowed_sections: string[];
  description: string | null;
};

function parseSections(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function listActiveTemplates(): Promise<SiteTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_templates")
    .select("id, name, slug, status, allowed_sections, description")
    .eq("status", "active")
    .order("name");

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
  template: SiteTemplate;
} | null> {
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) return null;

  const { data: assignment } = await supabase
    .from("business_template_assignments")
    .select("template_id")
    .eq("business_id", business.id)
    .maybeSingle();

  if (!assignment) return null;

  const { data: template } = await supabase
    .from("site_templates")
    .select("id, name, slug, status, allowed_sections, description")
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

  return {
    businessName: business.name,
    template: {
      ...template,
      allowed_sections: parseSections(template.allowed_sections),
    },
  };
}
