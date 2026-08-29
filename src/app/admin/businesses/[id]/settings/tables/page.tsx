import { notFound } from "next/navigation";
import { AdminHospitalityTablesForm } from "@/components/admin/business-settings-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { parseCustomTables } from "@/lib/dashboard/hospitality-settings";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessTablesSettingsPage({ params }: PageProps) {
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
      title="Tables"
      description="Table inventory, party size limits, and booking slots."
    >
      {settings ? (
        <AdminHospitalityTablesForm
          businessId={business.id}
          tables2Seat={settings.tables_2_seat}
          tables4Seat={settings.tables_4_seat}
          tables6Seat={settings.tables_6_seat}
          customTables={parseCustomTables(settings.custom_tables)}
          maxBookingsPerDay={settings.max_bookings_per_day}
          maxPartySize={settings.max_party_size}
          bookingSlotMinutes={settings.booking_slot_minutes}
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
