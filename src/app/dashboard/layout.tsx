import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  filterNavByCapabilities,
  navForDashboardMode,
} from "@/components/dashboard/shared/dashboard-nav";
import {
  getAuthSnapshot,
  getBusinessContext,
} from "@/lib/auth/business-context";
import { membershipLabelForMode } from "@/lib/business/modes";
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

  // Platform admins without a business membership belong in /admin, not the
  // empty business-dashboard membership error.
  if (snapshot.isMeridianAdmin && snapshot.memberships.length === 0) {
    redirect("/admin");
  }

  // Active business from verified cookie / membership — never from mode query.
  const context = await getBusinessContext();
  const business = context?.business;
  const businessName = business?.name ?? "Meridian";
  const role = context?.role ?? "staff";
  const dashboardMode = context?.dashboardMode ?? "hospitality";
  const capabilities = context?.capabilities;

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

  const businesses = snapshot.memberships.map((item) => ({
    id: item.business.id,
    name: item.business.name,
  }));

  const navItems = filterNavByCapabilities(
    navForDashboardMode(dashboardMode),
    capabilities,
  );

  return (
    <DashboardShell
      businessName={businessName}
      notificationEmail={notificationEmail}
      contactPhone={contactPhone}
      openingLabel={openingLabel}
      membershipLabel={membershipLabelForMode(dashboardMode)}
      publicBookHref={publicBookHref}
      accountName={accountName}
      accountTitle={role === "owner" ? "Business owner" : "Staff"}
      dashboardMode={dashboardMode}
      navItems={navItems}
      businesses={businesses}
      activeBusinessId={business?.id ?? null}
    >
      {children}
    </DashboardShell>
  );
}
