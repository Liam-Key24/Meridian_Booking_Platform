import { notFound } from "next/navigation";
import { AdminBrandingForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { DEFAULT_BRAND_COLORS } from "@/lib/admin/site-settings";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { templateBrandingPresetForSlug } from "@/lib/templates/catalog";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessBrandingSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  let { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select("*")
    .eq("business_id", id)
    .maybeSingle();

  if (!siteSettings) {
    await supabase.from("client_site_settings").insert({ business_id: id });
    const { data: created } = await supabase
      .from("client_site_settings")
      .select("*")
      .eq("business_id", id)
      .maybeSingle();
    siteSettings = created;
  }

  const { data: assignment } = await supabase
    .from("business_template_assignments")
    .select("template_id")
    .eq("business_id", id)
    .maybeSingle();

  const { data: assignedTemplate } = assignment
    ? await supabase
        .from("site_templates")
        .select("name, slug")
        .eq("id", assignment.template_id)
        .maybeSingle()
    : { data: null };

  return (
    <SettingsPanel
      title="Branding"
      description="Colours, logo, hero image, and gallery for future client templates."
    >
      <AdminBrandingForm
        businessId={business.id}
        primaryColor={siteSettings?.primary_color ?? DEFAULT_BRAND_COLORS.primary_color}
        accentColor={siteSettings?.accent_color ?? DEFAULT_BRAND_COLORS.accent_color}
        backgroundColor={
          siteSettings?.background_color ?? DEFAULT_BRAND_COLORS.background_color
        }
        textColor={siteSettings?.text_color ?? DEFAULT_BRAND_COLORS.text_color}
        logoPath={siteSettings?.logo_path ?? null}
        heroImagePath={siteSettings?.hero_image_path ?? null}
        galleryPaths={siteSettings?.gallery_paths ?? []}
        assignedTemplateName={assignedTemplate?.name ?? null}
        assignedTemplateBranding={
          assignedTemplate
            ? templateBrandingPresetForSlug(assignedTemplate.slug)
            : null
        }
      />
    </SettingsPanel>
  );
}
