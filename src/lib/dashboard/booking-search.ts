"use server";

import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";

export type BookingSearchHit = {
  id: string;
  customer_name: string;
  preferred_date: string;
  preferred_time: string;
  business_id?: string;
  business_name?: string;
};

export async function searchBookingsAutocomplete(
  query: string,
): Promise<BookingSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const snapshot = await getAuthSnapshot();
  if (!snapshot) return [];

  const supabase = await createClient();
  const escaped = q.replace(/[%_,]/g, "");
  if (!escaped) return [];

  let request = supabase
    .from("bookings")
    .select(
      "id, customer_name, preferred_date, preferred_time, business_id, businesses(name)",
    )
    .or(
      `customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
    )
    .order("preferred_date", { ascending: false })
    .limit(8);

  if (!snapshot.isMeridianAdmin) {
    const businessId = snapshot.memberships[0]?.business.id;
    if (!businessId) return [];
    request = request.eq("business_id", businessId);
  }

  const { data, error } = await request;

  if (error) {
    console.error("[bookings] autocomplete", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const business = Array.isArray(row.businesses)
      ? row.businesses[0]
      : row.businesses;
    return {
      id: row.id,
      customer_name: row.customer_name,
      preferred_date: row.preferred_date,
      preferred_time: row.preferred_time,
      business_id: row.business_id,
      business_name: business?.name,
    };
  });
}
