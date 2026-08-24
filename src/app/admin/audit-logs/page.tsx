import { AdminAuditLogsList } from "@/components/admin/admin-audit-logs-list";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuditLogsPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, business_id, actor_user_id, metadata, created_at, businesses(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (logs ?? []).map((log) => {
    const business = Array.isArray(log.businesses)
      ? log.businesses[0]
      : log.businesses;
    return {
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      created_at: log.created_at,
      business_name: business?.name ?? null,
    };
  });

  return <AdminAuditLogsList logs={rows} loadError={Boolean(error)} />;
}
