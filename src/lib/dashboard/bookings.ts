import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Tables } from "@/types/database";

export type BookingListItem = Tables<"bookings"> & {
  service: Pick<Tables<"services">, "id" | "name"> | null;
};

export type BookingFilters = {
  status?: BookingStatus | "all";
  from?: string;
  to?: string;
};

export async function listBookingsForBusiness(
  businessId: string,
  filters: BookingFilters = {},
): Promise<{ data: BookingListItem[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select("*, service:services(id, name)")
    .eq("business_id", businessId)
    .order("preferred_date", { ascending: true })
    .order("preferred_time", { ascending: true });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.from) {
    query = query.gte("preferred_date", filters.from);
  }

  if (filters.to) {
    query = query.lte("preferred_date", filters.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[dashboard] listBookingsForBusiness", error);
    return { data: [], error: "Could not load bookings." };
  }

  const rows = (data ?? []).map((row) => {
    const { service, ...booking } = row as Tables<"bookings"> & {
      service:
        | Pick<Tables<"services">, "id" | "name">
        | Pick<Tables<"services">, "id" | "name">[]
        | null;
    };
    const resolved = Array.isArray(service) ? service[0] : service;
    return {
      ...(booking as Tables<"bookings">),
      service: resolved ?? null,
    };
  });

  return { data: rows, error: null };
}

export async function getBookingForBusiness(
  businessId: string,
  bookingId: string,
): Promise<{ data: BookingListItem | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, service:services(id, name)")
    .eq("business_id", businessId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] getBookingForBusiness", error);
    return { data: null, error: "Could not load booking." };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const { service, ...booking } = data as Tables<"bookings"> & {
    service:
      | Pick<Tables<"services">, "id" | "name">
      | Pick<Tables<"services">, "id" | "name">[]
      | null;
  };
  const resolved = Array.isArray(service) ? service[0] : service;

  return {
    data: {
      ...(booking as Tables<"bookings">),
      service: resolved ?? null,
    },
    error: null,
  };
}
