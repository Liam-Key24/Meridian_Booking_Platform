"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";
import {
  canPreviewOrPublishTemplate,
  type TemplateStatus,
} from "@/lib/templates/publish-rules";
import type { Json } from "@/types/database";

export type TemplateSyncState = {
  status: "idle" | "success" | "error";
  message: string | null;
  version?: number;
};

async function writeAudit(params: {
  actorUserId: string;
  businessId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    business_id: params.businessId,
    actor_user_id: params.actorUserId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });
}

/**
 * Bump template config version and stamp assignment sync metadata.
 * Future template layouts read client_site_settings; this marks a publishable snapshot.
 */
export async function syncBusinessTemplate(
  businessId: string,
  options?: { quiet?: boolean },
): Promise<TemplateSyncState> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) {
    return { status: "error", message: "Meridian admin only." };
  }
  if (!businessId) {
    return { status: "error", message: "Missing business." };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return { status: "error", message: "Business not found." };
  }

  const { data: assignment } = await supabase
    .from("business_template_assignments")
    .select("id, template_id, sync_version")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!assignment) {
    return {
      status: "error",
      message:
        "No template assigned. Assign an active template before updating.",
    };
  }

  const { data: template } = await supabase
    .from("site_templates")
    .select("id, status, slug")
    .eq("id", assignment.template_id)
    .maybeSingle();

  const gate = {
    hasAssignment: true,
    templateStatus: (template?.status as TemplateStatus | null) ?? null,
  };

  if (!canPreviewOrPublishTemplate(gate)) {
    return {
      status: "error",
      message:
        "Assigned template is not active. Only active templates can be updated.",
    };
  }

  const { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select("id, template_config_version")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!siteSettings) {
    const { error: insertError } = await supabase
      .from("client_site_settings")
      .insert({ business_id: businessId });
    if (insertError) {
      return {
        status: "error",
        message: "Could not create site settings for sync.",
      };
    }
  }

  const nextVersion = (siteSettings?.template_config_version ?? 0) + 1;
  const now = new Date().toISOString();

  const { error: settingsError } = await supabase
    .from("client_site_settings")
    .update({
      template_config_version: nextVersion,
      template_synced_at: now,
      template_sync_error: null,
    })
    .eq("business_id", businessId);

  if (settingsError) {
    await supabase
      .from("client_site_settings")
      .update({ template_sync_error: settingsError.message })
      .eq("business_id", businessId);
    return { status: "error", message: "Could not bump template config version." };
  }

  const { error: assignmentError } = await supabase
    .from("business_template_assignments")
    .update({
      last_synced_at: now,
      sync_version: nextVersion,
    })
    .eq("business_id", businessId);

  if (assignmentError) {
    return {
      status: "error",
      message: "Version bumped but assignment sync stamp failed.",
    };
  }

  await writeAudit({
    actorUserId: snapshot.user.id,
    businessId,
    action: "admin.template.sync_branding",
    entityType: "client_site_settings",
    entityId: businessId,
    metadata: {
      version: nextVersion,
      template_id: assignment.template_id,
      template_slug: template?.slug ?? null,
    },
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}/settings`);
  await revalidatePublishedClientSitePaths(businessId);

  if (options?.quiet) {
    return {
      status: "success",
      message: null,
      version: nextVersion,
    };
  }

  return {
    status: "success",
    message: `Template updated (v${nextVersion}).`,
    version: nextVersion,
  };
}

export async function syncBusinessTemplateAction(
  _prev: TemplateSyncState,
  formData: FormData,
): Promise<TemplateSyncState> {
  const businessId = String(formData.get("businessId") ?? "");
  return syncBusinessTemplate(businessId);
}

export async function revalidatePublishedClientSitePaths(businessId: string) {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business?.slug) return;

  revalidatePath(`/preview/${business.slug}`);
  revalidatePath(`/menu/${business.slug}`);
  revalidatePath(`/book/${business.slug}`);
}

/**
 * After admin settings saves: sync assigned template if possible and return UI message.
 */
export async function syncSettingsToTemplate(
  businessId: string,
  savedMessage: string,
): Promise<string> {
  const sync = await maybeSyncBusinessTemplate(businessId);
  return sync.message ?? savedMessage;
}

/**
 * After settings saves: sync if an active assignment exists; otherwise no-op.
 */
export async function maybeSyncBusinessTemplate(
  businessId: string,
): Promise<{ synced: boolean; message: string | null }> {
  const result = await syncBusinessTemplate(businessId, { quiet: true });
  if (result.status === "success") {
    return {
      synced: true,
      message: result.version
        ? `Template synced (v${result.version}).`
        : "Template synced.",
    };
  }
  if (
    result.message?.includes("No template assigned") ||
    result.message?.includes("not active")
  ) {
    return {
      synced: false,
      message: "Saved. Assign an active template to publish settings to the client site.",
    };
  }
  return { synced: false, message: result.message };
}
