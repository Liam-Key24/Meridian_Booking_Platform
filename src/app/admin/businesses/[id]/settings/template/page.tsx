import { notFound } from "next/navigation";
import { AdminTemplateAssignForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import type { DashboardMode } from "@/lib/business/modes";
import { enrichTemplateForAdmin } from "@/lib/templates/catalog";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessTemplateSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, dashboard_mode")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";

  const [{ data: assignment }, { data: templates }] = await Promise.all([
    supabase
      .from("business_template_assignments")
      .select("template_id")
      .eq("business_id", id)
      .maybeSingle(),
    supabase
      .from("site_templates")
      .select("id, name, slug, status, description, allowed_sections, dashboard_mode")
      .eq("dashboard_mode", dashboardMode)
      .neq("status", "retired")
      .order("status")
      .order("name"),
  ]);

  return (
    <SettingsPanel
      title="Template"
      description="Choose the layout. Edit colours under Branding."
    >
      <AdminTemplateAssignForm
        businessId={business.id}
        businessSlug={business.slug}
        assignedTemplateId={assignment?.template_id ?? null}
        templates={(templates ?? []).map((template) =>
          enrichTemplateForAdmin(template),
        )}
      />
    </SettingsPanel>
  );
}
