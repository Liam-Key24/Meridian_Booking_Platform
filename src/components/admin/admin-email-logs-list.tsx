"use client";

import { EmailRetryButton } from "@/components/admin/email-retry-button";
import {
  AdminDataRow,
  AdminDataTable,
  AdminListHeader,
  AdminListPage,
  AdminListToolbar,
  AdminLocalSearch,
  AdminSoftStatus,
  useAdminListFilter,
  useListSearchState,
  type AdminListColumn,
} from "@/components/admin/admin-list";

export type EmailLogRow = {
  id: string;
  email_type: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  last_error: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  created_at: string;
  business_name: string | null;
};

const COLUMNS: AdminListColumn[] = [
  { key: "when", label: "Date", track: "minmax(9rem,0.85fr)" },
  { key: "type", label: "Type", track: "minmax(8rem,1fr)" },
  { key: "recipient", label: "Recipient", track: "minmax(10rem,1.2fr)" },
  { key: "business", label: "Business", track: "minmax(7rem,0.9fr)" },
  { key: "status", label: "Status", track: "minmax(6rem,0.7fr)" },
  { key: "actions", label: "Actions", track: "minmax(5.5rem,0.6fr)" },
];

function statusTone(
  status: string,
): "success" | "pending" | "danger" | "neutral" {
  if (status === "sent") return "success";
  if (status === "pending") return "pending";
  if (status === "failed" || status === "skipped") return "danger";
  return "neutral";
}

export function AdminEmailLogsList({
  logs,
  loadError,
}: {
  logs: EmailLogRow[];
  loadError: boolean;
}) {
  const [query, setQuery] = useListSearchState();
  const filtered = useAdminListFilter(
    logs,
    query,
    (row) =>
      `${row.email_type} ${row.recipient_email} ${row.business_name ?? ""} ${row.status}`,
  );
  const failedCount = logs.filter(
    (log) => log.status === "failed" || log.status === "skipped",
  ).length;

  return (
    <AdminListPage>
      <AdminListHeader
        title="Email logs"
        description={`Transactional email attempts. Failed and skipped sends can be retried once.${
          failedCount > 0 ? ` ${failedCount} failed/skipped on this page.` : ""
        }`}
      />
      <AdminListToolbar
        searchSlot={
          <AdminLocalSearch
            placeholder="Search type, recipient, business…"
            value={query}
            onChange={setQuery}
          />
        }
      >
        <p className="pb-1 text-sm text-meridian-text-muted">
          Showing {filtered.length} of {logs.length}
        </p>
      </AdminListToolbar>

      {loadError ? (
        <p className="text-sm text-meridian-status-declined">
          Could not load email logs.
        </p>
      ) : (
        <AdminDataTable
          columns={COLUMNS}
          rowCount={filtered.length}
          emptyTitle="No email attempts logged"
          emptyDescription="Sends, skips, and failures appear after booking emails run."
        >
          {filtered.map((log) => {
            const canRetry =
              log.status === "failed" || log.status === "skipped";
            return (
              <AdminDataRow
                key={log.id}
                columns={COLUMNS}
                cells={[
                  <div key="when" className="space-y-0.5">
                    <p className="text-meridian-text-muted tabular-nums">
                      {new Date(
                        log.last_attempt_at ?? log.created_at,
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-meridian-text-muted">
                      attempts: {log.attempt_count ?? 1}
                    </p>
                  </div>,
                  <div key="type" className="space-y-1">
                    <p className="font-medium">{log.email_type}</p>
                    {log.last_error || log.error_message ? (
                      <p className="line-clamp-2 text-xs text-meridian-status-declined">
                        {log.last_error ?? log.error_message}
                      </p>
                    ) : null}
                  </div>,
                  <span key="recipient" className="break-all text-meridian-text-muted">
                    {log.recipient_email}
                  </span>,
                  <span key="business" className="text-meridian-text-muted">
                    {log.business_name ?? "—"}
                  </span>,
                  <AdminSoftStatus
                    key="status"
                    label={log.status}
                    tone={statusTone(log.status)}
                  />,
                  <div key="actions">
                    {canRetry ? <EmailRetryButton logId={log.id} /> : "—"}
                  </div>,
                ]}
              />
            );
          })}
        </AdminDataTable>
      )}
    </AdminListPage>
  );
}
