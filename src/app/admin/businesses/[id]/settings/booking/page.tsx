import { notFound } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { BookingMode } from "@/types/database";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessBookingSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const [{ data: business }, { data: settings }] = await Promise.all([
    supabase.from("businesses").select("id").eq("id", id).maybeSingle(),
    supabase
      .from("booking_settings")
      .select("notification_email, timezone, booking_mode, external_booking_url")
      .eq("business_id", id)
      .maybeSingle(),
  ]);

  if (!business) notFound();

  return (
    <SettingsPanel
      title="Booking"
      description="How guests request bookings — Meridian, external provider, or hybrid."
    >
      {settings ? (
        <AdminSettingsForm
          businessId={business.id}
          notificationEmail={settings.notification_email}
          timezone={settings.timezone}
          bookingMode={settings.booking_mode as BookingMode}
          externalBookingUrl={settings.external_booking_url ?? ""}
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
