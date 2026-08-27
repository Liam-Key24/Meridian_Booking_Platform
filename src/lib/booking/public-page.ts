import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { DashboardMode } from "@/lib/business/modes";
import type { Tables } from "@/types/database";

export type PublicBookingPage = {
  business: Pick<
    Tables<"businesses">,
    "id" | "name" | "slug" | "status" | "dashboard_mode"
  >;
  settings: Pick<
    Tables<"booking_settings">,
    | "timezone"
    | "booking_mode"
    | "external_booking_url"
    | "notification_email"
    | "max_party_size"
    | "opening_hours"
    | "holidays"
    | "booking_slot_minutes"
  >;
  services: Array<
    Pick<Tables<"services">, "id" | "name" | "description" | "duration_minutes">
  >;
  dashboardMode: DashboardMode;
};

/** Load public booking page data via service role (never exposed to the browser). */
export async function getPublicBookingPage(
  slug: string,
): Promise<PublicBookingPage | null> {
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status, dashboard_mode")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) {
    return null;
  }

  const { data: settings } = await supabase
    .from("booking_settings")
    .select(
      "timezone, booking_mode, external_booking_url, notification_email, max_party_size, opening_hours, holidays, booking_slot_minutes",
    )
    .eq("business_id", business.id)
    .maybeSingle();

  if (!settings) {
    return null;
  }

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | null) ?? "hospitality";

  if (settings.booking_mode === "external") {
    return {
      business,
      settings,
      services: [],
      dashboardMode,
    };
  }

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  return {
    business,
    settings,
    services: services ?? [],
    dashboardMode,
  };
}
