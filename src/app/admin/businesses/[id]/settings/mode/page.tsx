import { notFound } from "next/navigation";
import { BusinessDashboardModeForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { BusinessType, DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessModeSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_type, dashboard_mode")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";

  return (
    <SettingsPanel
      title="Dashboard mode"
      description="Type and mode are server-authoritative. Changing mode resets capabilities to mode defaults."
    >
      <BusinessDashboardModeForm
        businessId={business.id}
        businessType={(business.business_type as BusinessType | null) ?? null}
        dashboardMode={dashboardMode}
      />
    </SettingsPanel>
  );
}
