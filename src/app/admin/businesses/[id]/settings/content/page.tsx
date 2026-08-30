import { notFound } from "next/navigation";
import { AdminContentForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { hasTemplateSection } from "@/lib/templates/catalog";
import {
  parseSiteSectionCopy,
  resolveSiteSectionCopy,
} from "@/lib/templates/section-copy";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessContentSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
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
        .select("name, allowed_sections")
        .eq("id", assignment.template_id)
        .maybeSingle()
    : { data: null };

  const allowedSections = Array.isArray(assignedTemplate?.allowed_sections)
    ? assignedTemplate.allowed_sections.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  return (
    <SettingsPanel
      title="Content"
      description="Images and written copy for each site section."
    >
      <AdminContentForm
        businessId={business.id}
        logoPath={siteSettings?.logo_path ?? null}
        faviconPath={siteSettings?.favicon_path ?? null}
        heroImagePath={siteSettings?.hero_image_path ?? null}
        galleryPaths={siteSettings?.gallery_paths ?? []}
        copy={resolveSiteSectionCopy(
          parseSiteSectionCopy(siteSettings?.section_copy_json),
        )}
        showHero={hasTemplateSection(allowedSections, "hero")}
        showGallery={hasTemplateSection(allowedSections, "gallery")}
        showContact={hasTemplateSection(allowedSections, "contact")}
        assignedTemplateName={assignedTemplate?.name ?? null}
        previewHref={`/preview/${business.slug}`}
      />
    </SettingsPanel>
  );
}
