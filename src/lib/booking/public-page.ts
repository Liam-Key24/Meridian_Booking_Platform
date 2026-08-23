import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export type PublicBookingPage = {
  business: Pick<Tables<"businesses">, "id" | "name" | "slug" | "status">;
  settings: Pick<
    Tables<"booking_settings">,
    "timezone" | "booking_mode" | "external_booking_url" | "notification_email"
  >;
  services: Array<
    Pick<Tables<"services">, "id" | "name" | "description" | "duration_minutes">
  >;
};

/** Load public booking page data via service role (never exposed to the browser). */
export async function getPublicBookingPage(
  slug: string,
): Promise<PublicBookingPage | null> {
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) {
    return null;
  }

  const { data: settings } = await supabase
    .from("booking_settings")
    .select("timezone, booking_mode, external_booking_url, notification_email")
    .eq("business_id", business.id)
    .maybeSingle();

  if (!settings) {
    return null;
  }

  if (settings.booking_mode === "external") {
    return {
      business,
      settings,
      services: [],
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
  };
}
