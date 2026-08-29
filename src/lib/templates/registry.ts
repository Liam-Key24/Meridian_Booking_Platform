import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import {
  getBusinessTemplatePreview,
  getClientSitePagePayload,
  type ClientSitePagePayload,
  type SiteTemplate,
} from "@/lib/templates/payload";

export {
  getBusinessTemplatePreview,
  getClientSitePagePayload,
  type ClientSitePagePayload,
  type SiteTemplate,
};

function parseSections(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function listActiveTemplates(
  dashboardMode?: SiteTemplate["dashboard_mode"],
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
