import { Badge, Card, EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEmailLogsPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("email_delivery_logs")
    .select(
      "id, email_type, recipient_email, status, error_message, business_id, booking_id, created_at, businesses(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const failedCount =
    logs?.filter((log) => log.status === "failed" || log.status === "skipped")
      .length ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Email delivery</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Email logs
        </h1>
        <p className="text-meridian-text-muted">
          Latest 100 transactional email attempts. Failed and skipped sends are
          highlighted for support.
          {failedCount > 0 ? ` (${failedCount} failed/skipped in this page)` : ""}
        </p>
      </header>

      <Card title="Recent sends">
        {error ? (
          <p className="text-sm text-meridian-status-declined">
            Could not load email logs.
          </p>
        ) : !logs?.length ? (
          <EmptyState
            title="No email attempts logged"
            description="Sends, skips (no Resend key), and failures appear after booking emails run."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {logs.map((log) => {
              const business = Array.isArray(log.businesses)
                ? log.businesses[0]
                : log.businesses;
              const tone =
                log.status === "sent"
                  ? "text-meridian-status-confirmed"
                  : "text-meridian-status-declined";
              return (
                <li key={log.id} className="space-y-1 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-meridian-text">
                      {log.email_type}
                    </p>
                    <p className={`text-xs font-semibold uppercase ${tone}`}>
                      {log.status}
                    </p>
                  </div>
                  <p className="text-sm text-meridian-text-muted">
                    {new Date(log.created_at).toLocaleString()} ·{" "}
                    {log.recipient_email}
                    {business?.name ? ` · ${business.name}` : ""}
                  </p>
                  {log.error_message ? (
                    <p className="text-sm text-meridian-status-declined">
                      {log.error_message}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
