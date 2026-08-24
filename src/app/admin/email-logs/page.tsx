import { AdminEmailLogsList } from "@/components/admin/admin-email-logs-list";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEmailLogsPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("email_delivery_logs")
    .select(
      "id, email_type, recipient_email, status, error_message, last_error, attempt_count, last_attempt_at, business_id, booking_id, created_at, businesses(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (logs ?? []).map((log) => {
    const business = Array.isArray(log.businesses)
      ? log.businesses[0]
      : log.businesses;
    return {
      id: log.id,
      email_type: log.email_type,
      recipient_email: log.recipient_email,
      status: log.status,
      error_message: log.error_message,
      last_error: log.last_error,
      attempt_count: log.attempt_count,
      last_attempt_at: log.last_attempt_at,
      created_at: log.created_at,
      business_name: business?.name ?? null,
    };
  });

  return <AdminEmailLogsList logs={rows} loadError={Boolean(error)} />;
}
