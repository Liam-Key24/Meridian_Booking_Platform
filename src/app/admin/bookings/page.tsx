import { AdminBookingsList } from "@/components/admin/admin-bookings-list";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

type PageProps = {
  searchParams: Promise<{
    businessId?: string;
    status?: string;
    q?: string;
  }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireMeridianAdmin();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .order("name");

  let query = supabase
    .from("bookings")
    .select(
      "id, business_id, customer_name, customer_email, preferred_date, preferred_time, status, created_at, businesses(name, slug)",
    )
    .order("preferred_date", { ascending: false })
    .limit(100);

  if (params.businessId) {
    query = query.eq("business_id", params.businessId);
  }
  if (
    params.status &&
    [
      "pending",
      "confirmed",
      "declined",
      "cancelled",
      "suggested",
      "no_show",
    ].includes(params.status)
  ) {
    query = query.eq("status", params.status as BookingStatus);
  }

  const q = (params.q ?? "").trim();
  if (q) {
    const escaped = q.replace(/[%_,]/g, "");
    if (escaped) {
      query = query.or(
        `customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
      );
    }
  }

  const { data: bookings, error } = await query;

  const rows = (bookings ?? []).map((booking) => {
    const business = Array.isArray(booking.businesses)
      ? booking.businesses[0]
      : booking.businesses;
    return {
      id: booking.id,
      business_id: booking.business_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      preferred_date: booking.preferred_date,
      preferred_time: booking.preferred_time,
      status: booking.status,
      business_name: business?.name ?? null,
    };
  });

  return (
    <AdminBookingsList
      bookings={rows}
      businesses={businesses ?? []}
      businessId={params.businessId ?? ""}
      status={params.status ?? ""}
      q={q}
      loadError={Boolean(error)}
    />
  );
}
