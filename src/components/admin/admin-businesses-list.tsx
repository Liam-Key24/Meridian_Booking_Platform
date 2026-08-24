"use client";

import Link from "next/link";
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
import {
  BUSINESS_TYPE_LABELS,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/business/modes";
import type {
  BusinessType,
  DashboardMode,
  SubscriptionStatus,
} from "@/types/database";

export type AdminBusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  business_type: string | null;
  dashboard_mode: string;
  subscription_status: string;
};

const COLUMNS: AdminListColumn[] = [
  { key: "name", label: "Business", track: "minmax(10rem,1.3fr)" },
  { key: "slug", label: "Slug", track: "minmax(7rem,0.9fr)" },
  { key: "type", label: "Type", track: "minmax(7rem,0.9fr)" },
  { key: "mode", label: "Mode", track: "minmax(6rem,0.7fr)" },
  { key: "subscription", label: "Subscription", track: "minmax(6rem,0.7fr)" },
  { key: "status", label: "Status", track: "minmax(5.5rem,0.55fr)" },
];

export function AdminBusinessesList({
  businesses,
  loadError,
}: {
  businesses: AdminBusinessRow[];
  loadError: boolean;
}) {
  const [query, setQuery] = useListSearchState();
  const filtered = useAdminListFilter(
    businesses,
    query,
    (row) =>
      `${row.name} ${row.slug} ${row.business_type ?? ""} ${row.dashboard_mode} ${row.subscription_status} ${row.status}`,
  );

  return (
    <AdminListPage>
      <AdminListHeader
        title="Businesses"
        description="Platform tenants and dashboard mode. Open a row to manage capabilities and ops health."
        actions={
          <Link
            href="/admin/businesses/new"
            className="inline-flex h-10 items-center justify-center rounded-meridian bg-meridian-accent px-4 text-sm font-semibold text-meridian-text-inverse"
          >
            New business
          </Link>
        }
      />

      <AdminListToolbar
        searchSlot={
          <AdminLocalSearch
            placeholder="Search name, slug, type, mode…"
            value={query}
            onChange={setQuery}
          />
        }
      >
        <p className="pb-1 text-sm text-meridian-text-muted">
          Showing {filtered.length} of {businesses.length}
        </p>
      </AdminListToolbar>

      {loadError ? (
        <p className="text-sm text-meridian-status-declined">
          Could not load businesses.
        </p>
      ) : (
        <AdminDataTable
          columns={COLUMNS}
          rowCount={filtered.length}
          emptyTitle="No businesses yet"
          emptyDescription="Create the first client business to begin onboarding."
        >
          {filtered.map((business) => {
            const mode =
              (business.dashboard_mode as DashboardMode | undefined) ??
              "hospitality";
            const subscription =
              (business.subscription_status as SubscriptionStatus | undefined) ??
              "none";
            const typeLabel = business.business_type
              ? (BUSINESS_TYPE_LABELS[
                  business.business_type as BusinessType
                ] ?? business.business_type)
              : "Unset";
            return (
              <AdminDataRow
                key={business.id}
                columns={COLUMNS}
                cells={[
                  <Link
                    key="name"
                    href={`/admin/businesses/${business.id}`}
                    className="font-semibold text-meridian-text hover:text-meridian-accent"
                  >
                    {business.name}
                  </Link>,
                  <span
                    key="slug"
                    className="text-meridian-text-muted tabular-nums"
                  >
                    /book/{business.slug}
                  </span>,
                  <span key="type" className="text-meridian-text-muted">
                    {typeLabel}
                  </span>,
                  <span key="mode" className="text-meridian-text-muted">
                    {DASHBOARD_MODE_LABELS[mode]}
                  </span>,
                  <span key="subscription" className="text-meridian-text-muted">
                    {SUBSCRIPTION_STATUS_LABELS[subscription]}
                  </span>,
                  <AdminSoftStatus
                    key="status"
                    label={business.status}
                    tone={business.status === "active" ? "success" : "neutral"}
                  />,
                ]}
              />
            );
          })}
        </AdminDataTable>
      )}
    </AdminListPage>
  );
}
