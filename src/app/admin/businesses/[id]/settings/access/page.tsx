import { notFound } from "next/navigation";
import { BusinessStatusForm, BusinessSubscriptionForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessAccessSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, subscription_status")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  const subscriptionStatus =
    (business.subscription_status as SubscriptionStatus | undefined) ?? "none";

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Access status"
        description="Suspend or reactivate this tenant for dashboard and booking access."
      >
        <BusinessStatusForm businessId={business.id} status={business.status} />
      </SettingsPanel>
      <SettingsPanel
        title="Subscription"
        description="Internal ops metadata only — not a payment integration."
      >
        <BusinessSubscriptionForm
          businessId={business.id}
          subscriptionStatus={subscriptionStatus}
        />
      </SettingsPanel>
    </div>
  );
}
