import { notFound } from "next/navigation";
import { AdminMenusForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { parseMenuPdfs } from "@/lib/admin/site-settings";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessMenusSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, dashboard_mode")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();
  const mode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  if (mode !== "hospitality") notFound();

  let { data: siteSettings } = await supabase
    .from("client_site_settings")
    .select("menu_pdfs_json")
    .eq("business_id", id)
    .maybeSingle();

  if (!siteSettings) {
    await supabase.from("client_site_settings").insert({ business_id: id });
    const { data: created } = await supabase
      .from("client_site_settings")
      .select("menu_pdfs_json")
      .eq("business_id", id)
      .maybeSingle();
    siteSettings = created;
  }

  const menuPdfs = parseMenuPdfs(siteSettings?.menu_pdfs_json);

  return (
    <SettingsPanel
      title="Menus"
      description="Upload menu PDFs for the public menu page. Guests can click a menu to open and zoom in."
    >
      <AdminMenusForm businessId={business.id} menuPdfs={menuPdfs} />
    </SettingsPanel>
  );
}
