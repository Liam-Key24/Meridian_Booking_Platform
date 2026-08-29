"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";
import {
  siteSettingsUseDefaultColors,
  templateBrandingPresetForSlug,
} from "@/lib/templates/catalog";
import {
  revalidatePublishedClientSitePaths,
  syncSettingsToTemplate,
} from "@/lib/templates/sync";

export type TemplateAssignState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export async function assignBusinessTemplate(
  _prev: TemplateAssignState,
  formData: FormData,
): Promise<TemplateAssignState> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!businessId) {
    return { status: "error", message: "Missing business." };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, dashboard_mode")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return { status: "error", message: "Business not found." };
  }

  if (!templateId) {
    const { error } = await supabase
      .from("business_template_assignments")
      .delete()
      .eq("business_id", businessId);
    if (error) {
      return { status: "error", message: "Could not clear template assignment." };
    }
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath(`/admin/businesses/${businessId}/settings/template`);
    await revalidatePublishedClientSitePaths(businessId);
    return { status: "success", message: "Template assignment cleared." };
  }

  const { data: template } = await supabase
    .from("site_templates")
    .select("id, status, dashboard_mode, slug")
    .eq("id", templateId)
    .maybeSingle();

  if (!template || template.status !== "active") {
    return {
      status: "error",
      message: "Only active templates can be assigned for preview/publishing.",
    };
  }

  if (
    template.dashboard_mode &&
    template.dashboard_mode !== business.dashboard_mode
  ) {
    return {
      status: "error",
      message:
        "Template dashboard mode must match the business mode before assignment.",
    };
  }

  const { error } = await supabase.from("business_template_assignments").upsert(
    {
      business_id: businessId,
      template_id: templateId,
      assigned_by: snapshot.user.id,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );

  if (error) {
    console.error("[templates] assign", error);
    return { status: "error", message: "Could not assign template." };
  }

  await supabase.from("client_site_settings").upsert(
    { business_id: businessId },
    { onConflict: "business_id", ignoreDuplicates: true },
  );

  const { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select("primary_color, accent_color, background_color, text_color")
    .eq("business_id", businessId)
    .maybeSingle();

  if (siteSettings && siteSettingsUseDefaultColors(siteSettings)) {
    const preset = templateBrandingPresetForSlug(template.slug);
    await supabase
      .from("client_site_settings")
      .update({
        primary_color: preset.primary,
        accent_color: preset.accent,
        background_color: preset.background,
        text_color: preset.text,
      })
      .eq("business_id", businessId);
  }

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}/settings/branding`);
  revalidatePath(`/admin/businesses/${businessId}/settings/template`);
  await revalidatePublishedClientSitePaths(businessId);
  const message = await syncSettingsToTemplate(
    businessId,
    "Template assigned.",
  );
  return { status: "success", message };
}
