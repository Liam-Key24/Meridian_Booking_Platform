"use client";

import {
  AdminDataRow,
  AdminDataTable,
  AdminListHeader,
  AdminListPage,
  AdminListToolbar,
  AdminLocalSearch,
  useAdminListFilter,
  useListSearchState,
  type AdminListColumn,
} from "@/components/admin/admin-list";
import { formatDateTime } from "@/lib/format/datetime";

export type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  business_name: string | null;
};

const COLUMNS: AdminListColumn[] = [
  { key: "when", label: "Date", track: "minmax(9rem,0.9fr)" },
  { key: "action", label: "Action", track: "minmax(12rem,1.4fr)" },
  { key: "business", label: "Business", track: "minmax(8rem,1fr)" },
  { key: "entity", label: "Entity", track: "minmax(8rem,0.9fr)" },
];

export function AdminAuditLogsList({
  logs,
  loadError,
}: {
  logs: AuditLogRow[];
  loadError: boolean;
}) {
  const [query, setQuery] = useListSearchState();
  const filtered = useAdminListFilter(
    logs,
    query,
    (row) =>
      `${row.action} ${row.business_name ?? ""} ${row.entity_type} ${row.entity_id ?? ""}`,
  );

  return (
    <AdminListPage>
      <AdminListHeader
        title="Audit logs"
        description="Privileged actions across the platform. Latest 100 entries."
      />
      <AdminListToolbar
        searchSlot={
          <AdminLocalSearch
            placeholder="Search actions, business, entity…"
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
          Could not load audit logs.
        </p>
      ) : (
        <AdminDataTable
          columns={COLUMNS}
          rowCount={filtered.length}
          emptyTitle="No audit entries"
          emptyDescription="Booking decisions and admin changes will appear here."
        >
          {filtered.map((log) => (
            <AdminDataRow
              key={log.id}
              columns={COLUMNS}
              cells={[
                <span
                  key="when"
                  className="text-meridian-text-muted tabular-nums"
                >
                  {formatDateTime(log.created_at)}
                </span>,
                <span key="action" className="font-medium">
                  {log.action}
                </span>,
                <span key="business" className="text-meridian-text-muted">
                  {log.business_name ?? "—"}
                </span>,
                <span key="entity" className="text-meridian-text-muted">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                </span>,
              ]}
            />
          ))}
        </AdminDataTable>
      )}
    </AdminListPage>
  );
}
