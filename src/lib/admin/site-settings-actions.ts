"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  BUSINESS_ASSETS_BUCKET,
  isValidHexColor,
  menuToJson,
  parseBusinessMenu,
  type BusinessMenu,
} from "@/lib/admin/site-settings";
import { maybeSyncBusinessTemplate } from "@/lib/templates/sync";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type SiteSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function requireAdminActor() {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) return null;
  return snapshot;
}

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

async function ensureSiteSettings(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_site_settings")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (data) return { ok: true as const };
  const { error } = await supabase
    .from("client_site_settings")
    .insert({ business_id: businessId });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

function settingsPaths(businessId: string) {
  return [
    `/admin/businesses/${businessId}`,
    `/admin/businesses/${businessId}/settings`,
    `/admin/businesses/${businessId}/settings/branding`,
    `/admin/businesses/${businessId}/settings/menus`,
    `/admin/businesses/${businessId}/settings/template`,
  ];
}

function revalidateSettings(businessId: string) {
  for (const path of settingsPaths(businessId)) {
    revalidatePath(path);
  }
}

async function uploadBusinessAsset(
  businessId: string,
  file: File,
  kind: "logo" | "hero" | "gallery",
): Promise<{ path: string } | { error: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Use JPEG, PNG, WebP, GIF, or SVG images." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 5MB or smaller." };
  }

  const ext =
    file.type === "image/svg+xml"
      ? "svg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
  const objectPath = `${businessId}/${kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("[admin] asset upload", error);
    return { error: "Could not upload image." };
  }
  return { path: objectPath };
}

export async function updateBusinessBranding(
  _prev: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const primary = String(formData.get("primaryColor") ?? "").trim();
  const accent = String(formData.get("accentColor") ?? "").trim();
  const background = String(formData.get("backgroundColor") ?? "").trim();
  const text = String(formData.get("textColor") ?? "").trim();

  if (
    ![primary, accent, background, text].every((c) => isValidHexColor(c))
  ) {
    return {
      status: "error",
      message: "Colours must be hex values like #0F766E.",
    };
  }

  const ensured = await ensureSiteSettings(businessId);
  if (!ensured.ok) {
    return { status: "error", message: "Could not create site settings." };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("client_site_settings")
    .select("logo_path, hero_image_path, gallery_paths")
    .eq("business_id", businessId)
    .maybeSingle();

  let logoPath = current?.logo_path ?? null;
  let heroPath = current?.hero_image_path ?? null;
  let galleryPaths = [...(current?.gallery_paths ?? [])];

  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const uploaded = await uploadBusinessAsset(businessId, logoFile, "logo");
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    logoPath = uploaded.path;
  }
  if (formData.get("clearLogo") === "on") {
    logoPath = null;
  }

  const heroFile = formData.get("heroImage");
  if (heroFile instanceof File && heroFile.size > 0) {
    const uploaded = await uploadBusinessAsset(businessId, heroFile, "hero");
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    heroPath = uploaded.path;
  }
  if (formData.get("clearHero") === "on") {
    heroPath = null;
  }

  const galleryFile = formData.get("galleryImage");
  if (galleryFile instanceof File && galleryFile.size > 0) {
    const uploaded = await uploadBusinessAsset(
      businessId,
      galleryFile,
      "gallery",
    );
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    galleryPaths = [...galleryPaths, uploaded.path].slice(-12);
  }

  const removeGalleryPaths = formData
    .getAll("removeGalleryPath")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (removeGalleryPaths.length > 0) {
    galleryPaths = galleryPaths.filter((p) => !removeGalleryPaths.includes(p));
  }

  const { error } = await supabase
    .from("client_site_settings")
    .update({
      primary_color: primary,
      accent_color: accent,
      background_color: background,
      text_color: text,
      logo_path: logoPath,
      hero_image_path: heroPath,
      gallery_paths: galleryPaths,
    })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not save branding." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.site_settings.update_branding",
    entityType: "client_site_settings",
    entityId: businessId,
    metadata: { primary, accent },
  });

  const sync = await maybeSyncBusinessTemplate(businessId);
  revalidateSettings(businessId);

  return {
    status: "success",
    message: sync.message ?? "Branding saved.",
  };
}

export async function updateBusinessMenus(
  _prev: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const rawJson = String(formData.get("menuJson") ?? "");

  let menu: BusinessMenu;
  try {
    menu = parseBusinessMenu(JSON.parse(rawJson) as unknown);
  } catch {
    return { status: "error", message: "Invalid menu payload." };
  }

  for (const section of menu.sections) {
    if (!section.title.trim()) {
      return { status: "error", message: "Each section needs a title." };
    }
    for (const item of section.items) {
      if (!item.name.trim()) {
        return { status: "error", message: "Each menu item needs a name." };
      }
    }
  }

  const ensured = await ensureSiteSettings(businessId);
  if (!ensured.ok) {
    return { status: "error", message: "Could not create site settings." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_site_settings")
    .update({ menu_json: menuToJson(menu) })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not save menus." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.site_settings.update_menus",
    entityType: "client_site_settings",
    entityId: businessId,
    metadata: { sections: menu.sections.length },
  });

  const sync = await maybeSyncBusinessTemplate(businessId);
  revalidateSettings(businessId);

  return {
    status: "success",
    message: sync.message ?? "Menus saved.",
  };
}
