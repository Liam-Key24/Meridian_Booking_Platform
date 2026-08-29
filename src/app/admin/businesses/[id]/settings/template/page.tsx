import { notFound } from "next/navigation";
import { AdminTemplateAssignForm } from "@/components/admin/business-forms";
import { AdminTemplateSyncForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessTemplateSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const [
    { data: business },
    { data: assignment },
    { data: templates },
    { data: siteSettings },
  ] = await Promise.all([
    supabase.from("businesses").select("id, slug").eq("id", id).maybeSingle(),
    supabase
      .from("business_template_assignments")
      .select("template_id, last_synced_at, sync_version")
      .eq("business_id", id)
      .maybeSingle(),
    supabase
      .from("site_templates")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("client_site_settings")
      .select(
        "template_config_version, template_synced_at, template_sync_error",
      )
      .eq("business_id", id)
      .maybeSingle(),
  ]);

  if (!business) notFound();

  return (
    <SettingsPanel
      title="Template"
      description="Assign a Meridian template and push branding/menus when layouts are ready."
    >
      <AdminTemplateAssignForm
        businessId={business.id}
        businessSlug={business.slug}
        assignedTemplateId={assignment?.template_id ?? null}
        templates={templates ?? []}
      />
      <AdminTemplateSyncForm
        businessId={business.id}
        configVersion={siteSettings?.template_config_version ?? 0}
        syncedAt={siteSettings?.template_synced_at ?? null}
        syncError={siteSettings?.template_sync_error ?? null}
        assignmentSyncVersion={assignment?.sync_version ?? null}
        lastSyncedAt={assignment?.last_synced_at ?? null}
      />
    </SettingsPanel>
  );
}
