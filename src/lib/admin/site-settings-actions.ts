"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  BUSINESS_ASSETS_BUCKET,
  isValidHexColor,
  MAX_MENU_PDF_BYTES,
  MENU_PDF_MIME,
  menuPdfsToJson,
  menuToJson,
  parseBusinessMenu,
  parseMenuPdfs,
  type BusinessMenu,
  type BusinessMenuPdfs,
  type MenuPdfDocument,
} from "@/lib/admin/site-settings";
import { revalidatePublishedClientSitePaths, syncSettingsToTemplate } from "@/lib/templates/sync";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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
    `/admin/businesses/${businessId}/settings/content`,
    `/admin/businesses/${businessId}/settings/menus`,
    `/admin/businesses/${businessId}/settings/template`,
  ];
}

function revalidateSettings(businessId: string) {
  for (const path of settingsPaths(businessId)) {
    revalidatePath(path);
  }
}

async function revalidateClientSitePages(businessId: string) {
  revalidateSettings(businessId);
  await revalidatePublishedClientSitePaths(businessId);
}

const FONT_EXTENSIONS = new Set(["woff2", "woff", "ttf", "otf"]);
const FAVICON_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const MAX_FONT_BYTES = 2 * 1024 * 1024;

function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function imageExtension(file: File): string {
  if (file.type === "image/svg+xml" || fileExtension(file) === "svg") return "svg";
  if (file.type === "image/png" || fileExtension(file) === "png") return "png";
  if (file.type === "image/webp" || fileExtension(file) === "webp") return "webp";
  if (file.type === "image/gif" || fileExtension(file) === "gif") return "gif";
  if (
    file.type === "image/x-icon" ||
    file.type === "image/vnd.microsoft.icon" ||
    fileExtension(file) === "ico"
  ) {
    return "ico";
  }
  return "jpg";
}

async function storeBusinessAsset(
  businessId: string,
  file: File,
  kind: string,
  ext: string,
): Promise<{ path: string } | { error: string }> {
  const objectPath = `${businessId}/${kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[admin] asset upload", error);
    return { error: "Could not upload file." };
  }
  return { path: objectPath };
}

async function uploadBusinessAsset(
  businessId: string,
  file: File,
  kind: "logo" | "hero" | "gallery" | "favicon",
): Promise<{ path: string } | { error: string }> {
  const allowed = kind === "favicon" ? FAVICON_TYPES : ALLOWED_IMAGE_TYPES;
  if (!allowed.has(file.type) && !(kind === "favicon" && fileExtension(file) === "ico")) {
    return {
      error:
        kind === "favicon"
          ? "Use ICO, PNG, SVG, JPEG, WebP, or GIF for the favicon."
          : "Use JPEG, PNG, WebP, GIF, or SVG images.",
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 5MB or smaller." };
  }

  return storeBusinessAsset(businessId, file, kind, imageExtension(file));
}

async function uploadBusinessFont(
  businessId: string,
  file: File,
  kind: "heading-font" | "body-font",
): Promise<{ path: string } | { error: string }> {
  const ext = fileExtension(file);
  if (!FONT_EXTENSIONS.has(ext)) {
    return { error: "Use WOFF2, WOFF, TTF, or OTF font files." };
  }
  if (file.size > MAX_FONT_BYTES) {
    return { error: "Font must be 2MB or smaller." };
  }

  return storeBusinessAsset(businessId, file, kind, ext);
}

async function uploadMenuPdf(
  businessId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  if (file.type !== MENU_PDF_MIME) {
    return { error: "Upload PDF files only." };
  }
  if (file.size > MAX_MENU_PDF_BYTES) {
    return { error: "Menu PDF must be 15MB or smaller." };
  }

  const objectPath = `${businessId}/menus/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(objectPath, buffer, {
      contentType: MENU_PDF_MIME,
      upsert: false,
    });

  if (error) {
    console.error("[admin] menu pdf upload", error);
    return { error: "Could not upload menu PDF." };
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
    .select("heading_font_path, body_font_path")
    .eq("business_id", businessId)
    .maybeSingle();

  let headingFontPath = current?.heading_font_path ?? null;
  let bodyFontPath = current?.body_font_path ?? null;

  const headingFont = formData.get("headingFont");
  if (headingFont instanceof File && headingFont.size > 0) {
    const uploaded = await uploadBusinessFont(
      businessId,
      headingFont,
      "heading-font",
    );
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    headingFontPath = uploaded.path;
  }
  if (formData.get("clearHeadingFont") === "on") {
    headingFontPath = null;
  }

  const bodyFont = formData.get("bodyFont");
  if (bodyFont instanceof File && bodyFont.size > 0) {
    const uploaded = await uploadBusinessFont(businessId, bodyFont, "body-font");
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    bodyFontPath = uploaded.path;
  }
  if (formData.get("clearBodyFont") === "on") {
    bodyFontPath = null;
  }

  const adminDb = createServiceRoleClient();
  const { error } = await adminDb
    .from("client_site_settings")
    .update({
      primary_color: primary,
      accent_color: accent,
      background_color: background,
      text_color: text,
      heading_font_path: headingFontPath,
      body_font_path: bodyFontPath,
    })
    .eq("business_id", businessId);

  if (error) {
    console.error("[admin] save branding", error);
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

  await syncSettingsToTemplate(businessId, "Branding saved.");
  revalidateSettings(businessId);
  await revalidatePublishedClientSitePaths(businessId);

  return {
    status: "success",
    message: "Branding saved.",
  };
}

export async function updateBusinessContent(
  _prev: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const ensured = await ensureSiteSettings(businessId);
  if (!ensured.ok) {
    return { status: "error", message: "Could not create site settings." };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("client_site_settings")
    .select("logo_path, favicon_path, hero_image_path, gallery_paths")
    .eq("business_id", businessId)
    .maybeSingle();

  let logoPath = current?.logo_path ?? null;
  let faviconPath = current?.favicon_path ?? null;
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

  const faviconFile = formData.get("favicon");
  if (faviconFile instanceof File && faviconFile.size > 0) {
    const uploaded = await uploadBusinessAsset(
      businessId,
      faviconFile,
      "favicon",
    );
    if ("error" in uploaded) {
      return { status: "error", message: uploaded.error };
    }
    faviconPath = uploaded.path;
  }
  if (formData.get("clearFavicon") === "on") {
    faviconPath = null;
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

  const adminDb = createServiceRoleClient();
  const { error } = await adminDb
    .from("client_site_settings")
    .update({
      logo_path: logoPath,
      favicon_path: faviconPath,
      hero_image_path: heroPath,
      gallery_paths: galleryPaths,
    })
    .eq("business_id", businessId);

  if (error) {
    console.error("[admin] save content", error);
    return { status: "error", message: "Could not save content." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.site_settings.update_content",
    entityType: "client_site_settings",
    entityId: businessId,
    metadata: { hasLogo: Boolean(logoPath), hasHero: Boolean(heroPath) },
  });

  await syncSettingsToTemplate(businessId, "Content saved.");
  revalidateSettings(businessId);
  await revalidatePublishedClientSitePaths(businessId);

  return {
    status: "success",
    message: "Content saved.",
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

  const message = await syncSettingsToTemplate(businessId, "Menus saved.");
  await revalidateClientSitePages(businessId);

  return {
    status: "success",
    message,
  };
}

export async function updateBusinessMenuPdfs(
  _prev: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  const actor = await requireAdminActor();
  if (!actor) {
    return { status: "error", message: "Meridian admin only." };
  }

  const businessId = String(formData.get("businessId") ?? "");
  const pdfIds = formData.getAll("pdfIds").map(String).filter(Boolean);

  if (!businessId) {
    return { status: "error", message: "Missing business." };
  }

  const documents: MenuPdfDocument[] = [];

  for (const id of pdfIds) {
    const title = String(formData.get(`title-${id}`) ?? "").trim();
    const visible = formData.get(`visible-${id}`) === "on";
    const existingPath = String(formData.get(`path-${id}`) ?? "").trim();
    const file = formData.get(`file-${id}`);

    if (!title) {
      return { status: "error", message: "Each menu PDF needs a title." };
    }

    let path = existingPath;
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadMenuPdf(businessId, file);
      if ("error" in uploaded) {
        return { status: "error", message: uploaded.error };
      }
      path = uploaded.path;
    }

    if (!path) {
      return {
        status: "error",
        message: `Upload a PDF for "${title}".`,
      };
    }

    documents.push({ id, title, path, visible });
  }

  const ensured = await ensureSiteSettings(businessId);
  if (!ensured.ok) {
    return { status: "error", message: "Could not create site settings." };
  }

  const pdfs: BusinessMenuPdfs = { documents };
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_site_settings")
    .update({ menu_pdfs_json: menuPdfsToJson(pdfs) })
    .eq("business_id", businessId);

  if (error) {
    return { status: "error", message: "Could not save menu PDFs." };
  }

  await writeAudit({
    actorUserId: actor.user.id,
    businessId,
    action: "admin.site_settings.update_menu_pdfs",
    entityType: "client_site_settings",
    entityId: businessId,
    metadata: { documents: documents.length },
  });

  const message = await syncSettingsToTemplate(businessId, "Menu PDFs saved.");
  await revalidateClientSitePages(businessId);

  return {
    status: "success",
    message,
  };
}
