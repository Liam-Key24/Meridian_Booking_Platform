import { notFound } from "next/navigation";
import { AdminServiceForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessServicesSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const [{ data: business }, { data: services }] = await Promise.all([
    supabase.from("businesses").select("id, dashboard_mode").eq("id", id).maybeSingle(),
    supabase.from("services").select("*").eq("business_id", id).order("name"),
  ]);

  if (!business) notFound();
  const mode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  if (mode !== "appointments") notFound();

  return (
    <SettingsPanel
      title="Services"
      description="Bookable services and durations for appointments-mode businesses."
    >
      <div className="space-y-4">
        {(services ?? []).map((service) => (
          <AdminServiceForm
            key={service.id}
            businessId={business.id}
            service={service}
          />
        ))}
        <AdminServiceForm businessId={business.id} />
      </div>
    </SettingsPanel>
  );
}
