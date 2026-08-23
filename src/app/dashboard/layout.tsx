import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthSnapshot } from "@/lib/auth/business-context";
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

  let bookingMode: string | null = null;
  let publicBookHref: string | null = null;

  if (business) {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("booking_settings")
      .select("booking_mode")
      .eq("business_id", business.id)
      .maybeSingle();
    bookingMode = settings?.booking_mode ?? null;
    publicBookHref = `/book/${business.slug}`;
  }

  return (
    <DashboardShell
      businessName={businessName}
      businessStatus={business?.status ?? "unknown"}
      bookingMode={bookingMode}
      publicBookHref={publicBookHref}
      userEmail={snapshot.user.email}
    >
      {children}
    </DashboardShell>
  );
}
