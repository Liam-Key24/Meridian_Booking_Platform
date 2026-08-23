import { NextResponse } from "next/server";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export async function GET(request: Request) {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json(
      { error: "businessId query param is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, customer_name, customer_email, customer_phone, preferred_date, preferred_time, guest_count, status, notes, created_at, confirmed_at, service:services(name)",
    )
    .eq("business_id", businessId)
    .order("preferred_date", { ascending: true });

  if (error) {
    console.error("[admin export]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const header = [
    "id",
    "customer_name",
    "customer_email",
    "customer_phone",
    "service",
    "preferred_date",
    "preferred_time",
    "guest_count",
    "status",
    "notes",
    "created_at",
    "confirmed_at",
  ];

  const lines = [
    header.join(","),
    ...(bookings ?? []).map((row) => {
      const service = Array.isArray(row.service) ? row.service[0] : row.service;
      return [
        row.id,
        row.customer_name,
        row.customer_email,
        row.customer_phone,
        service?.name ?? "",
        row.preferred_date,
        row.preferred_time,
        row.guest_count,
        row.status,
        row.notes,
        row.created_at,
        row.confirmed_at,
      ]
        .map(csvEscape)
        .join(",");
    }),
  ];

  const filename = `bookings-${business.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`${lines.join("\n")}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
