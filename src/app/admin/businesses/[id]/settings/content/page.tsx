import { notFound } from "next/navigation";
import { AdminContentForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
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

  return (
    <SettingsPanel
      title="Content"
      description="Logo, favicon, hero, and gallery for the assigned template."
    >
      <AdminContentForm
        businessId={business.id}
        logoPath={siteSettings?.logo_path ?? null}
        faviconPath={siteSettings?.favicon_path ?? null}
        heroImagePath={siteSettings?.hero_image_path ?? null}
        galleryPaths={siteSettings?.gallery_paths ?? []}
        previewHref={`/preview/${business.slug}`}
      />
    </SettingsPanel>
  );
}
