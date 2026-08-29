import { notFound } from "next/navigation";
import { AdminBusinessDetailsForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessDetailsSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const [{ data: business }, { data: settings }] = await Promise.all([
    supabase.from("businesses").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("booking_settings")
      .select("notification_email, contact_phone, timezone")
      .eq("business_id", id)
      .maybeSingle(),
  ]);

  if (!business) notFound();

  return (
    <SettingsPanel
      title="Details"
      description="Business name, contact email, phone, and timezone."
    >
      {settings ? (
        <AdminBusinessDetailsForm
          businessId={business.id}
          name={business.name}
          notificationEmail={settings.notification_email}
          contactPhone={settings.contact_phone ?? ""}
          timezone={settings.timezone}
        />
      ) : (
        <EmptyState
          title="Settings missing"
          description="This business has no booking_settings row."
        />
      )}
    </SettingsPanel>
  );
}
