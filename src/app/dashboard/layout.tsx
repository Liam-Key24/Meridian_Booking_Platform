import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  defaultWeeklyHours,
  parseWeeklyHours,
  todayOpeningLabel,
} from "@/lib/dashboard/hospitality-settings";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login?next=/dashboard");
  }

  const membership = snapshot.memberships[0];
  const business = membership?.business;
  const businessName = business?.name ?? "Meridian";
  const role = membership?.membership.role ?? "staff";

  let notificationEmail: string | null = null;
  let contactPhone: string | null = null;
  let openingLabel = "Hours not set";
  let publicBookHref: string | null = null;

  if (business) {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("booking_settings")
      .select("notification_email, contact_phone, opening_hours")
      .eq("business_id", business.id)
      .maybeSingle();

    notificationEmail = settings?.notification_email ?? null;
    contactPhone = settings?.contact_phone ?? null;
    const hours =
      settings?.opening_hours &&
      typeof settings.opening_hours === "object" &&
      Object.keys(settings.opening_hours as object).length > 0
        ? parseWeeklyHours(settings.opening_hours)
        : defaultWeeklyHours();
    openingLabel = todayOpeningLabel(hours);
    publicBookHref = `/book/${business.slug}`;
  }

  const accountName =
    snapshot.profile?.full_name?.trim() ||
    snapshot.user.email?.split("@")[0] ||
    "Account";

  return (
    <DashboardShell
      businessName={businessName}
      notificationEmail={notificationEmail}
      contactPhone={contactPhone}
      openingLabel={openingLabel}
      membershipLabel="Hospitality"
      publicBookHref={publicBookHref}
      accountName={accountName}
      accountTitle={role === "owner" ? "Business owner" : "Staff"}
    >
      {children}
    </DashboardShell>
  );
}
