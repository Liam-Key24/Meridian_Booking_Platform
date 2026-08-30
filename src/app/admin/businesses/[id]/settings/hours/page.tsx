import { notFound } from "next/navigation";
import { AdminHospitalityHoursForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import {
  parseHolidays,
  parseKitchenCloseTimes,
  parseWeeklyHours,
} from "@/lib/dashboard/hospitality-settings";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessHoursSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const [{ data: business }, { data: settings }] = await Promise.all([
    supabase.from("businesses").select("id, dashboard_mode").eq("id", id).maybeSingle(),
    supabase.from("booking_settings").select("*").eq("business_id", id).maybeSingle(),
  ]);

  if (!business) notFound();
  const mode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  if (mode !== "hospitality") notFound();

  return (
    <SettingsPanel
      title="Hours"
      description="Opening times, kitchen close, bar hours, and holidays."
    >
      {settings ? (
        <AdminHospitalityHoursForm
          businessId={business.id}
          openingHours={parseWeeklyHours(settings.opening_hours)}
          kitchenCloseEnabled={settings.kitchen_close_enabled}
          kitchenCloseTimes={parseKitchenCloseTimes(settings.kitchen_close_times)}
          barHoursEnabled={settings.bar_hours_enabled}
          barOpeningHours={parseWeeklyHours(settings.bar_opening_hours)}
          holidays={parseHolidays(settings.holidays)}
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
