import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { BusinessSettingsForm } from "@/components/dashboard/business-settings-form";
import {
  defaultBarHours,
  defaultKitchenCloseTimes,
  defaultWeeklyHours,
  parseCustomTables,
  parseHolidays,
  parseKitchenCloseTimes,
  parseWeeklyHours,
} from "@/lib/dashboard/hospitality-settings";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

export default async function DashboardSettingsPage() {
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="flex w-full flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_id", context.business.id)
    .maybeSingle();

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
      <header className="space-y-2">
        <Badge tone="accent">Settings</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Business settings
        </h1>
        <p className="max-w-2xl text-meridian-text-muted">
          Contact details, table plan, service hours, and booking limits for{" "}
          {context.business.name}.
        </p>
      </header>

      <Card
        title="Hospitality configuration"
        description="Keep venue hours and capacity in sync with the calendar and booking form."
      >
        {error ? (
          <ErrorState
            title="Could not load settings"
            description="Please try again."
          />
        ) : !settings ? (
          <EmptyState
            title="Settings not configured"
            description="Ask a Meridian admin to create booking settings for this business."
          />
        ) : (
          <BusinessSettingsForm
            businessId={context.business.id}
            name={context.business.name}
            notificationEmail={settings.notification_email}
            contactPhone={settings.contact_phone ?? ""}
            timezone={settings.timezone}
            bookingMode={settings.booking_mode}
            externalBookingUrl={settings.external_booking_url ?? ""}
            tables2Seat={settings.tables_2_seat ?? 0}
            tables4Seat={settings.tables_4_seat ?? 0}
            tables6Seat={settings.tables_6_seat ?? 0}
            customTables={parseCustomTables(settings.custom_tables)}
            openingHours={
              settings.opening_hours &&
              typeof settings.opening_hours === "object" &&
              Object.keys(settings.opening_hours as object).length > 0
                ? parseWeeklyHours(settings.opening_hours)
                : defaultWeeklyHours()
            }
            kitchenCloseTimes={
              settings.kitchen_close_times &&
              typeof settings.kitchen_close_times === "object" &&
              Object.keys(settings.kitchen_close_times as object).length > 0
                ? parseKitchenCloseTimes(settings.kitchen_close_times)
                : defaultKitchenCloseTimes()
            }
            barOpeningHours={
              settings.bar_opening_hours &&
              typeof settings.bar_opening_hours === "object" &&
              Object.keys(settings.bar_opening_hours as object).length > 0
                ? parseWeeklyHours(settings.bar_opening_hours)
                : defaultBarHours()
            }
            holidays={parseHolidays(settings.holidays)}
            maxBookingsPerDay={settings.max_bookings_per_day}
            maxPartySize={settings.max_party_size}
            bookingSlotMinutes={settings.booking_slot_minutes ?? 15}
            canEdit={context.role === "owner" || context.isMeridianAdmin}
          />
        )}
      </Card>
    </main>
  );
}
