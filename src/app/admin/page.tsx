import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import {
  BUSINESS_TYPE_LABELS,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/business/modes";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessType,
  DashboardMode,
  SubscriptionStatus,
} from "@/types/database";

export default async function AdminBusinessesPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, status, business_type, dashboard_mode, subscription_status, created_at",
    )
    .order("name");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Businesses
          </h1>
          <p className="max-w-2xl text-meridian-text-muted">
            Platform tenants and their dashboard mode. Open a business to manage
            capabilities, subscription metadata, and ops health.
          </p>
        </div>
        <Link
          href="/admin/businesses/new"
          className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-accent px-5 text-sm font-semibold text-meridian-text-inverse"
        >
          New business
        </Link>
      </header>

      <Card
        title="All businesses"
        description={`${businesses?.length ?? 0} total`}
      >
        {error ? (
          <p className="text-sm text-meridian-status-declined">
            Could not load businesses.
          </p>
        ) : !businesses?.length ? (
          <EmptyState
            title="No businesses yet"
            description="Create the first client business to begin onboarding."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {businesses.map((business) => {
              const mode =
                (business.dashboard_mode as DashboardMode | undefined) ??
                "hospitality";
              const subscription =
                (business.subscription_status as
                  | SubscriptionStatus
                  | undefined) ?? "none";
              const typeLabel = business.business_type
                ? (BUSINESS_TYPE_LABELS[
                    business.business_type as BusinessType
                  ] ?? business.business_type)
                : "Unset type";
              return (
                <li
                  key={business.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="space-y-1.5">
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="font-semibold text-meridian-text hover:text-meridian-accent"
                    >
                      {business.name}
                    </Link>
                    <p className="text-sm text-meridian-text-muted">
                      /book/{business.slug}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-meridian-accent uppercase">
                        {DASHBOARD_MODE_LABELS[mode]}
                      </span>
                      <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                        {typeLabel}
                      </span>
                      <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                        {SUBSCRIPTION_STATUS_LABELS[subscription]}
                      </span>
                    </div>
                  </div>
                  <span
                    className={
                      business.status === "active"
                        ? "inline-flex items-center rounded-meridian-sm bg-[color-mix(in_srgb,var(--meridian-accent)_16%,white)] px-2.5 py-1 text-xs font-semibold text-meridian-accent uppercase"
                        : "inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-xs font-semibold text-meridian-text-muted uppercase"
                    }
                  >
                    {business.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
