import { notFound } from "next/navigation";
import { BusinessCapabilitiesForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { listBusinessCapabilitiesForAdmin } from "@/lib/admin/business-ops";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessCapabilitiesSettingsPage({
  params,
}: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, dashboard_mode, business_type")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  const capabilities = await listBusinessCapabilitiesForAdmin(id, {
    dashboard_mode: dashboardMode,
    business_type: business.business_type,
  });

  return (
    <SettingsPanel
      title="Capabilities"
      description="Allowlisted features for this business. Toggle on or off for a fast setup."
    >
      <BusinessCapabilitiesForm
        businessId={business.id}
        capabilities={capabilities}
      />
    </SettingsPanel>
  );
}
