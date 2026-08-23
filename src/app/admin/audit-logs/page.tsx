import { Badge, Card, EmptyState } from "@/components/ui";
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Audit</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Audit logs
        </h1>
        <p className="text-meridian-text-muted">
          Latest 100 privileged actions across the platform.
        </p>
      </header>

      <Card title="Recent activity">
        {error ? (
          <p className="text-sm text-meridian-status-declined">
            Could not load audit logs.
          </p>
        ) : !logs?.length ? (
          <EmptyState
            title="No audit entries yet"
            description="Booking decisions and admin changes will appear here."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {logs.map((log) => {
              const business = Array.isArray(log.businesses)
                ? log.businesses[0]
                : log.businesses;
              return (
                <li key={log.id} className="space-y-1 py-3">
                  <p className="font-medium text-meridian-text">{log.action}</p>
                  <p className="text-sm text-meridian-text-muted">
                    {new Date(log.created_at).toLocaleString()}
                    {business?.name ? ` · ${business.name}` : ""}
                    {` · ${log.entity_type}`}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
