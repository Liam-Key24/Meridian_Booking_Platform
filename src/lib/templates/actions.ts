"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";

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

  if (!templateId) {
    const { error } = await supabase
      .from("business_template_assignments")
      .delete()
      .eq("business_id", businessId);
    if (error) {
      return { status: "error", message: "Could not clear template assignment." };
    }
    revalidatePath(`/admin/businesses/${businessId}`);
    return { status: "success", message: "Template assignment cleared." };
  }

  const { data: template } = await supabase
    .from("site_templates")
    .select("id, status")
    .eq("id", templateId)
    .maybeSingle();

  if (!template || template.status !== "active") {
    return {
      status: "error",
      message: "Only active templates can be assigned for preview/publishing.",
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

  revalidatePath(`/admin/businesses/${businessId}`);
  return { status: "success", message: "Template assigned." };
}
