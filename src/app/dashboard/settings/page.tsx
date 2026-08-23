import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { BusinessSettingsForm } from "@/components/dashboard/business-settings-form";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardContext } from "@/lib/dashboard/require-context";

export default async function DashboardSettingsPage() {
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Settings</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Business settings
        </h1>
        <p className="text-meridian-text-muted">
          Name, notification email, timezone, and booking mode for{" "}
          {context.business.name}.
        </p>
      </header>

      <Card title="Booking configuration">
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
            timezone={settings.timezone}
            bookingMode={settings.booking_mode}
            externalBookingUrl={settings.external_booking_url ?? ""}
            canEdit={context.role === "owner" || context.isMeridianAdmin}
          />
        )}
      </Card>
    </main>
  );
}
