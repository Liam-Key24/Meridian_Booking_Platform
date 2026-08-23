import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Tables } from "@/types/database";
import { addDays, formatLocalDate } from "@/lib/dashboard/calendar";
import {
  aggregateServiceCounts,
  bucketByDay,
  countByStatus,
  resolveWeekRange,
  type DayCount,
  type ServiceCount,
  type StatusCounts,
} from "@/lib/dashboard/analytics-math";

export type DashboardRange = {
  from: string;
  to: string;
  days: number;
};

export type DashboardMetrics = {
  range: DashboardRange;
  pendingCount: number;
  confirmedToday: number;
  upcomingConfirmed7d: number;
  cancelledInRange: number;
  activeServices: number;
  statusDistribution: StatusCounts;
  requestsByDay: DayCount[];
  confirmedByDay: DayCount[];
  topServices: ServiceCount[];
  warnings: string[];
  recentPending: Array<{
    id: string;
    customer_name: string;
    preferred_date: string;
    preferred_time: string;
    status: BookingStatus;
    created_at: string;
    service_name: string | null;
  }>;
  upcomingConfirmed: Array<{
    id: string;
    customer_name: string;
    preferred_date: string;
    preferred_time: string;
    status: BookingStatus;
    service_name: string | null;
  }>;
  bookingMode: Tables<"booking_settings">["booking_mode"] | null;
  notificationEmail: string | null;
  externalBookingUrl: string | null;
  timezone: string | null;
};

export async function getDashboardMetrics(
  businessId: string,
  options?: { weekStart?: string },
): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  const supabase = await createClient();
  const week = resolveWeekRange(options?.weekStart);
  const range = { from: week.from, to: week.to, days: week.days };
  const today = formatLocalDate(new Date());
  const in7 = formatLocalDate(addDays(new Date(), 6));

  const [
    bookingsInRange,
    pendingRows,
    confirmedTodayRows,
    upcomingRows,
    allStatusRows,
    createdRows,
    confirmedPrefRows,
    serviceRows,
    servicesActive,
    settings,
    recentPendingRaw,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status")
      .eq("business_id", businessId)
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .eq("preferred_date", today),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, preferred_date, preferred_time, status, service:services(name)",
      )
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .gte("preferred_date", today)
      .lte("preferred_date", in7)
      .order("preferred_date", { ascending: true })
      .order("preferred_time", { ascending: true })
      .limit(8),
    supabase
      .from("bookings")
      .select("status")
      .eq("business_id", businessId)
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`),
    supabase
      .from("bookings")
      .select("created_at")
      .eq("business_id", businessId)
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`),
    supabase
      .from("bookings")
      .select("preferred_date")
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .gte("preferred_date", range.from)
      .lte("preferred_date", range.to),
    supabase
      .from("bookings")
      .select("service_id, service:services(name)")
      .eq("business_id", businessId)
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true),
    supabase
      .from("booking_settings")
      .select("booking_mode, notification_email, external_booking_url, timezone")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, preferred_date, preferred_time, status, created_at, service:services(name)",
      )
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const errors = [
    bookingsInRange.error,
    pendingRows.error,
    confirmedTodayRows.error,
    upcomingRows.error,
    allStatusRows.error,
    createdRows.error,
    confirmedPrefRows.error,
    serviceRows.error,
    servicesActive.error,
    settings.error,
    recentPendingRaw.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("[dashboard] metrics", errors);
    return { data: null, error: "Could not load dashboard metrics." };
  }

  const cancelledInRange = (bookingsInRange.data ?? []).filter(
    (row) => row.status === "cancelled",
  ).length;

  const warnings: string[] = [];
  if ((servicesActive.count ?? 0) === 0) {
    warnings.push(
      "No active services — public Meridian requests cannot be taken.",
    );
  }
  if (!settings.data?.notification_email) {
    warnings.push("Notification email is missing in booking settings.");
  }
  if (
    settings.data &&
    settings.data.booking_mode !== "meridian" &&
    !settings.data.external_booking_url
  ) {
    warnings.push(
      "External booking URL is required for the selected booking mode.",
    );
  }

  const mapRow = (row: {
    id: string;
    customer_name: string;
    preferred_date: string;
    preferred_time: string;
    status: BookingStatus;
    created_at?: string;
    service: { name: string } | { name: string }[] | null;
  }) => {
    const service = Array.isArray(row.service) ? row.service[0] : row.service;
    return {
      id: row.id,
      customer_name: row.customer_name,
      preferred_date: row.preferred_date,
      preferred_time: row.preferred_time,
      status: row.status,
      created_at: row.created_at ?? "",
      service_name: service?.name ?? null,
    };
  };

  return {
    data: {
      range,
      pendingCount: pendingRows.count ?? 0,
      confirmedToday: confirmedTodayRows.count ?? 0,
      upcomingConfirmed7d: upcomingRows.data?.length ?? 0,
      cancelledInRange,
      activeServices: servicesActive.count ?? 0,
      statusDistribution: countByStatus(allStatusRows.data ?? []),
      requestsByDay: bucketByDay(
        (createdRows.data ?? []).map((row) => ({
          date: row.created_at.slice(0, 10),
        })),
        range.from,
        range.to,
      ),
      confirmedByDay: bucketByDay(
        (confirmedPrefRows.data ?? []).map((row) => ({
          date: row.preferred_date,
        })),
        range.from,
        range.to,
      ),
      topServices: aggregateServiceCounts(
        (serviceRows.data ?? []).map((row) => {
          const service = Array.isArray(row.service)
            ? row.service[0]
            : row.service;
          return {
            service_id: row.service_id,
            service_name: service?.name ?? null,
          };
        }),
      ).slice(0, 5),
      warnings,
      recentPending: (recentPendingRaw.data ?? []).map(mapRow),
      upcomingConfirmed: (upcomingRows.data ?? []).map(mapRow),
      bookingMode: settings.data?.booking_mode ?? null,
      notificationEmail: settings.data?.notification_email ?? null,
      externalBookingUrl: settings.data?.external_booking_url ?? null,
      timezone: settings.data?.timezone ?? null,
    },
    error: null,
  };
}
