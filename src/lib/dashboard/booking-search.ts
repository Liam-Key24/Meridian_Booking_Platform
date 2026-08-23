"use server";

import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";

export type BookingSearchHit = {
  id: string;
  customer_name: string;
  preferred_date: string;
  preferred_time: string;
};

export async function searchBookingsAutocomplete(
  query: string,
): Promise<BookingSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const snapshot = await getAuthSnapshot();
  if (!snapshot) return [];

  const businessId = snapshot.memberships[0]?.business.id;
  if (!businessId) return [];

  const supabase = await createClient();
  const escaped = q.replace(/[%_,]/g, "");
  if (!escaped) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_name, preferred_date, preferred_time")
    .eq("business_id", businessId)
    .or(
      `customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
    )
    .order("preferred_date", { ascending: false })
    .limit(8);

  if (error) {
    console.error("[bookings] autocomplete", error);
    return [];
  }

  return data ?? [];
}
