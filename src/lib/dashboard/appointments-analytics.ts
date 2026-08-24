import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";
import { addDays, formatLocalDate } from "@/lib/dashboard/calendar";
import {
  aggregateServiceCounts,
  bucketByDay,
  countByStatus,
  fillPeriodBuckets,
  parseRequestsPeriod,
  resolveRequestsPeriodRange,
  resolveWeekRange,
  type DayCount,
  type PeriodCount,
  type RequestsPeriod,
  type ServiceCount,
  type StatusCounts,
} from "@/lib/dashboard/analytics-math";

export type AppointmentListItem = {
  id: string;
  customer_name: string;
  preferred_date: string;
  preferred_time: string;
  status: BookingStatus;
  created_at?: string;
  service_name: string | null;
  duration_minutes: number | null;
  staff_name: string | null;
};

export type StaffWorkload = {
  userId: string;
  name: string;
  role: string;
  assignedCount: number;
};

export type CustomerSummary = {
  email: string;
  name: string;
  appointmentCount: number;
  lastPreferredDate: string | null;
};

export type AppointmentsDashboardMetrics = {
  appointmentsToday: number;
  pendingRequests: number;
  confirmedInRange: number;
  cancelledInRange: number;
  noShowsInRange: number;
  conversionRate: number | null;
  statusDistribution: StatusCounts;
  appointmentsByDay: DayCount[];
  requestsByPeriod: PeriodCount[];
  requestsPeriod: RequestsPeriod;
  requestsPeriodLabel: string;
  busiestServices: ServiceCount[];
  staffWorkload: StaffWorkload[];
  recentPending: AppointmentListItem[];
  upcomingConfirmed: AppointmentListItem[];
  customers: CustomerSummary[];
  services: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    is_active: boolean;
  }>;
  externalBookingUrl: string | null;
  notificationEmail: string | null;
  warnings: string[];
};

function mapAppointmentRow(
  row: {
    id: string;
    customer_name: string;
    preferred_date: string;
    preferred_time: string;
    status: BookingStatus;
    created_at?: string;
    assigned_staff_user_id?: string | null;
    service:
      | { name: string; duration_minutes: number }
      | { name: string; duration_minutes: number }[]
      | null;
  },
  staffNameById: Map<string, string>,
): AppointmentListItem {
  const service = Array.isArray(row.service) ? row.service[0] : row.service;
  return {
    id: row.id,
    customer_name: row.customer_name,
    preferred_date: row.preferred_date,
    preferred_time: row.preferred_time,
    status: row.status,
    created_at: row.created_at,
    service_name: service?.name ?? null,
    duration_minutes: service?.duration_minutes ?? null,
    staff_name: row.assigned_staff_user_id
      ? (staffNameById.get(row.assigned_staff_user_id) ?? null)
      : null,
  };
}

export async function getAppointmentsDashboardMetrics(
  businessId: string,
  options?: { weekStart?: string; requestsPeriod?: RequestsPeriod | string },
): Promise<{ data: AppointmentsDashboardMetrics | null; error: string | null }> {
  const supabase = await createClient();
  const week = resolveWeekRange(options?.weekStart);
  const range = { from: week.from, to: week.to };
  const requestsPeriod = parseRequestsPeriod(options?.requestsPeriod);
  const requestsRange = resolveRequestsPeriodRange(
    requestsPeriod,
    options?.weekStart ?? week.from,
  );
  const today = formatLocalDate(new Date());
  const in7 = formatLocalDate(addDays(new Date(), 6));
  const day30 = formatLocalDate(addDays(new Date(), -29));

  const [
    bookingsInRange,
    pendingRows,
    todayConfirmed,
    upcomingRows,
    statusRows,
    createdRows,
    confirmedPrefRows,
    serviceAggRows,
    servicesActive,
    settings,
    recentPendingRaw,
    membershipRows,
    assignedRows,
    customerSourceRows,
    servicesList,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status")
      .eq("business_id", businessId)
      .gte("preferred_date", range.from)
      .lte("preferred_date", range.to),
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
        "id, customer_name, preferred_date, preferred_time, status, assigned_staff_user_id, service:services(name, duration_minutes)",
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
      .gte("preferred_date", range.from)
      .lte("preferred_date", range.to),
    supabase
      .from("bookings")
      .select("created_at")
      .eq("business_id", businessId)
      .gte("created_at", `${requestsRange.from}T00:00:00.000Z`)
      .lte("created_at", `${requestsRange.to}T23:59:59.999Z`),
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
      .gte("preferred_date", day30)
      .lte("preferred_date", today),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true),
    supabase
      .from("booking_settings")
      .select("notification_email, external_booking_url")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, preferred_date, preferred_time, status, created_at, assigned_staff_user_id, service:services(name, duration_minutes)",
      )
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("business_memberships")
      .select("user_id, role, status")
      .eq("business_id", businessId)
      .eq("status", "active"),
    supabase
      .from("bookings")
      .select("assigned_staff_user_id")
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .gte("preferred_date", range.from)
      .lte("preferred_date", range.to)
      .not("assigned_staff_user_id", "is", null),
    supabase
      .from("bookings")
      .select("customer_email, customer_name, preferred_date")
      .eq("business_id", businessId)
      .order("preferred_date", { ascending: false })
      .limit(500),
    supabase
      .from("services")
      .select("id, name, duration_minutes, is_active")
      .eq("business_id", businessId)
      .order("name"),
  ]);

  const errors = [
    bookingsInRange.error,
    pendingRows.error,
    todayConfirmed.error,
    upcomingRows.error,
    statusRows.error,
    createdRows.error,
    confirmedPrefRows.error,
    serviceAggRows.error,
    servicesActive.error,
    settings.error,
    recentPendingRaw.error,
    membershipRows.error,
    assignedRows.error,
    customerSourceRows.error,
    servicesList.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("[appointments] metrics", errors);
    return { data: null, error: "Could not load appointments dashboard." };
  }

  const statusDistribution = countByStatus(statusRows.data ?? []);
  const cancelledInRange = (bookingsInRange.data ?? []).filter(
    (row) => row.status === "cancelled",
  ).length;
  const noShowsInRange = (bookingsInRange.data ?? []).filter(
    (row) => row.status === "no_show",
  ).length;
  const confirmedInRange = (bookingsInRange.data ?? []).filter(
    (row) => row.status === "confirmed",
  ).length;
  const decided =
    confirmedInRange +
    (statusDistribution.declined ?? 0) +
    cancelledInRange +
    noShowsInRange;
  const conversionRate =
    decided > 0 ? Math.round((confirmedInRange / decided) * 1000) / 10 : null;

  const warnings: string[] = [];
  if ((servicesActive.count ?? 0) === 0) {
    warnings.push("No active services — clients cannot request appointments.");
  }
  if (!settings.data?.notification_email) {
    warnings.push("Notification email is missing in appointment settings.");
  }

  const staffIds = (membershipRows.data ?? []).map((row) => row.user_id);
  const { data: profiles } =
    staffIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", staffIds)
      : { data: [] as Array<{ id: string; email: string; full_name: string | null }> };

  const assignedCounts = new Map<string, number>();
  for (const row of assignedRows.data ?? []) {
    if (!row.assigned_staff_user_id) continue;
    assignedCounts.set(
      row.assigned_staff_user_id,
      (assignedCounts.get(row.assigned_staff_user_id) ?? 0) + 1,
    );
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const staffNameById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      p.full_name?.trim() || p.email || p.id,
    ]),
  );
  const staffWorkload: StaffWorkload[] = (membershipRows.data ?? []).map(
    (row) => {
      const profile = profileById.get(row.user_id);
      return {
        userId: row.user_id,
        name: profile?.full_name?.trim() || profile?.email || row.user_id,
        role: row.role,
        assignedCount: assignedCounts.get(row.user_id) ?? 0,
      };
    },
  );

  const customerMap = new Map<string, CustomerSummary>();
  for (const row of customerSourceRows.data ?? []) {
    const email = row.customer_email.toLowerCase();
    const existing = customerMap.get(email);
    if (existing) {
      existing.appointmentCount += 1;
      if (
        !existing.lastPreferredDate ||
        row.preferred_date > existing.lastPreferredDate
      ) {
        existing.lastPreferredDate = row.preferred_date;
        existing.name = row.customer_name;
      }
    } else {
      customerMap.set(email, {
        email,
        name: row.customer_name,
        appointmentCount: 1,
        lastPreferredDate: row.preferred_date,
      });
    }
  }

  return {
    data: {
      appointmentsToday: todayConfirmed.count ?? 0,
      pendingRequests: pendingRows.count ?? 0,
      confirmedInRange,
      cancelledInRange,
      noShowsInRange,
      conversionRate,
      statusDistribution,
      appointmentsByDay: bucketByDay(
        (confirmedPrefRows.data ?? []).map((row) => ({
          date: row.preferred_date,
        })),
        range.from,
        range.to,
      ),
      requestsByPeriod: fillPeriodBuckets(
        (createdRows.data ?? []).map((row) => ({
          date: row.created_at.slice(0, 10),
        })),
        requestsPeriod,
        requestsRange.buckets,
      ),
      requestsPeriod,
      requestsPeriodLabel: requestsRange.rangeLabel,
      busiestServices: aggregateServiceCounts(
        (serviceAggRows.data ?? []).map((row) => {
          const service = Array.isArray(row.service)
            ? row.service[0]
            : row.service;
          return {
            service_id: row.service_id,
            service_name: service?.name ?? null,
          };
        }),
      ).slice(0, 5),
      staffWorkload,
      recentPending: (recentPendingRaw.data ?? []).map((row) =>
        mapAppointmentRow(row, staffNameById),
      ),
      upcomingConfirmed: (upcomingRows.data ?? []).map((row) =>
        mapAppointmentRow(row, staffNameById),
      ),
      customers: Array.from(customerMap.values())
        .sort((a, b) => b.appointmentCount - a.appointmentCount)
        .slice(0, 50),
      services: servicesList.data ?? [],
      externalBookingUrl: settings.data?.external_booking_url ?? null,
      notificationEmail: settings.data?.notification_email ?? null,
      warnings,
    },
    error: null,
  };
}

export async function listAppointmentCustomers(businessId: string) {
  const { data, error } = await getAppointmentsDashboardMetrics(businessId);
  if (error || !data) return { data: [] as CustomerSummary[], error };
  return { data: data.customers, error: null };
}
