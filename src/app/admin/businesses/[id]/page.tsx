import Link from "next/link";
import {
  AddMembershipForm,
  AdminServiceForm,
  AdminSettingsForm,
  AdminTemplateAssignForm,
  BusinessCapabilitiesForm,
  BusinessDashboardModeForm,
  BusinessStatusForm,
  BusinessSubscriptionForm,
  MembershipRowForm,
} from "@/components/admin/business-forms";
import {
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import {
  MetricCard,
  MetricIconCancelled,
  MetricIconConfirmed,
  MetricIconPending,
  MetricIconUpcoming,
} from "@/components/dashboard/metric-card";
import {
  getAdminBusinessOpsMetrics,
  listBusinessAuditHistory,
  listBusinessCapabilitiesForAdmin,
} from "@/lib/admin/business-ops";
import {
  BUSINESS_TYPE_LABELS,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/business/modes";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { formatDateTime } from "@/lib/format/datetime";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessType,
  DashboardMode,
  SubscriptionStatus,
} from "@/types/database";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return formatDateTime(value);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-meridian-border pt-8 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-meridian-text">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-meridian-text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
        <ErrorState
          title="Business not found"
          description="This business id does not exist."
        />
      </main>
    );
  }

  const dashboardMode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";
  const subscriptionStatus =
    (business.subscription_status as SubscriptionStatus | undefined) ?? "none";
  const typeLabel = business.business_type
    ? (BUSINESS_TYPE_LABELS[business.business_type as BusinessType] ??
      business.business_type)
    : "Type unset";

  const [
    { data: settings },
    { data: membershipRows },
    { data: services },
    { data: assignment },
    { data: templates },
    { data: metrics },
    { data: auditHistory, error: auditError },
  ] = await Promise.all([
    supabase
      .from("booking_settings")
      .select("*")
      .eq("business_id", id)
      .maybeSingle(),
    supabase
      .from("business_memberships")
      .select("id, role, status, user_id")
      .eq("business_id", id)
      .order("created_at"),
    supabase.from("services").select("*").eq("business_id", id).order("name"),
    supabase
      .from("business_template_assignments")
      .select("template_id")
      .eq("business_id", id)
      .maybeSingle(),
    supabase
      .from("site_templates")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name"),
    getAdminBusinessOpsMetrics(id),
    listBusinessAuditHistory(id, 25),
  ]);

  const capabilities = await listBusinessCapabilitiesForAdmin(id, {
    dashboard_mode: dashboardMode,
    business_type: business.business_type,
  });

  const userIds = (membershipRows ?? []).map((row) => row.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)
      : {
          data: [] as Array<{
            id: string;
            email: string;
            full_name: string | null;
          }>,
        };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const bookingsHref = `/admin/bookings?businessId=${business.id}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-10">
      <header className="space-y-3">
        <Link
          href="/admin"
          className="text-sm font-semibold text-meridian-accent hover:underline"
        >
          ← Businesses
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
              {business.name}
            </h1>
            <p className="max-w-2xl text-meridian-text-muted">
              Platform controls for this tenant — mode, capabilities, and
              operational health. No customer contact details shown here.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-accent uppercase">
                {DASHBOARD_MODE_LABELS[dashboardMode]}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {typeLabel}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {business.status}
              </span>
              <span className="inline-flex items-center rounded-meridian-sm bg-meridian-surface-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
                {SUBSCRIPTION_STATUS_LABELS[subscriptionStatus]}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href={`/book/${business.slug}`}
              className="text-meridian-accent hover:underline"
            >
              Public book page
            </Link>
            <Link
              href={bookingsHref}
              className="text-meridian-accent hover:underline"
            >
              Bookings
            </Link>
            <a
              href={`/admin/bookings/export?businessId=${business.id}`}
              className="text-meridian-accent hover:underline"
            >
              Export CSV
            </a>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-meridian-text sm:text-2xl">
          Live metrics
        </h2>
        {metrics ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Pending"
                value={metrics.pendingVolume}
                href={`${bookingsHref}&status=pending`}
                icon={<MetricIconPending />}
              />
              <MetricCard
                label="Confirmed"
                value={metrics.confirmedVolume}
                href={`${bookingsHref}&status=confirmed`}
                icon={<MetricIconConfirmed />}
              />
              <MetricCard
                label="Bookings"
                value={metrics.bookingVolume}
                href={bookingsHref}
                icon={<MetricIconUpcoming />}
              />
              <MetricCard
                label="Cancelled"
                value={metrics.cancellationVolume}
                href={`${bookingsHref}&status=cancelled`}
                icon={<MetricIconCancelled />}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-meridian border border-meridian-border bg-meridian-surface p-5">
                <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Email activity
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-meridian-text">
                  {metrics.emailSent}{" "}
                  <span className="text-base font-medium text-meridian-text-muted">
                    sent
                  </span>
                </p>
                <p className="mt-1 text-sm text-meridian-text-muted">
                  {metrics.emailFailed} failed · {metrics.emailTotal} recent
                  samples · {metrics.noShowVolume} no-shows
                </p>
              </div>
              <div className="rounded-meridian border border-meridian-border bg-meridian-surface p-5">
                <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
                  Last activity
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-meridian-text">
                  {formatWhen(metrics.lastActivityAt)}
                </p>
                <p className="mt-1 text-sm text-meridian-text-muted">
                  Booking {formatWhen(metrics.lastBookingAt)} · Email{" "}
                  {formatWhen(metrics.lastEmailAt)} · Audit{" "}
                  {formatWhen(metrics.lastAuditAt)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-meridian-status-declined">
            Could not load operational metrics.
          </p>
        )}
      </section>

      <Card padding="lg">
        <div className="space-y-0">
          <Section
            title="Access status"
            description="Suspend or reactivate this tenant for dashboard and booking access."
          >
            <BusinessStatusForm
              businessId={business.id}
              status={business.status}
            />
          </Section>

          <Section
            title="Subscription"
            description="Internal ops metadata only — not a payment integration."
          >
            <BusinessSubscriptionForm
              businessId={business.id}
              subscriptionStatus={subscriptionStatus}
            />
          </Section>

          <Section
            title="Dashboard mode"
            description="Type and mode are server-authoritative. Changing mode resets capabilities to mode defaults."
          >
            <BusinessDashboardModeForm
              businessId={business.id}
              businessType={
                (business.business_type as BusinessType | null) ?? null
              }
              dashboardMode={dashboardMode}
            />
          </Section>

          <Section
            title="Capabilities"
            description="Allowlisted features for this business. Same On/Off pattern as client settings."
          >
            <BusinessCapabilitiesForm
              businessId={business.id}
              capabilities={capabilities}
            />
          </Section>

          <Section
            title="Members"
            description="Add users who have already signed up, then set owner or staff."
          >
            <div className="space-y-6">
              {(membershipRows ?? []).length === 0 ? (
                <EmptyState
                  title="No members"
                  description="Add an existing user by email after they have signed up."
                />
              ) : (
                <ul className="space-y-4">
                  {(membershipRows ?? []).map((membership) => {
                    const profile = profileById.get(membership.user_id);
                    return (
                      <li
                        key={membership.id}
                        className="rounded-meridian border border-meridian-border bg-meridian-surface-muted/40 p-4"
                      >
                        <p className="mb-3 font-medium text-meridian-text">
                          {profile?.email ?? membership.user_id}
                          {profile?.full_name ? (
                            <span className="text-meridian-text-muted">
                              {" "}
                              · {profile.full_name}
                            </span>
                          ) : null}
                        </p>
                        <MembershipRowForm
                          businessId={business.id}
                          membershipId={membership.id}
                          role={membership.role}
                          status={membership.status}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
              <AddMembershipForm businessId={business.id} />
            </div>
          </Section>

          <Section title="Site template">
            <AdminTemplateAssignForm
              businessId={business.id}
              businessSlug={business.slug}
              assignedTemplateId={assignment?.template_id ?? null}
              templates={templates ?? []}
            />
          </Section>

          <Section title="Booking settings">
            {settings ? (
              <AdminSettingsForm
                businessId={business.id}
                notificationEmail={settings.notification_email}
                timezone={settings.timezone}
                bookingMode={settings.booking_mode}
                externalBookingUrl={settings.external_booking_url ?? ""}
              />
            ) : (
              <EmptyState
                title="Settings missing"
                description="This business has no booking_settings row."
              />
            )}
          </Section>

          <Section
            title="Services"
            description="Shared service catalogue used by appointments-mode businesses."
          >
            <div className="space-y-4">
              {(services ?? []).map((service) => (
                <AdminServiceForm
                  key={service.id}
                  businessId={business.id}
                  service={service}
                />
              ))}
              <AdminServiceForm businessId={business.id} />
            </div>
          </Section>

          <Section
            title="Audit history"
            description="Recent privileged changes for this business (no customer PII)."
          >
            {auditError ? (
              <p className="text-sm text-meridian-status-declined">
                {auditError}
              </p>
            ) : auditHistory.length === 0 ? (
              <EmptyState
                title="No audit entries"
                description="Admin and booking decisions for this business will appear here."
              />
            ) : (
              <ul className="divide-y divide-meridian-border rounded-meridian border border-meridian-border">
                {auditHistory.map((entry) => (
                  <li key={entry.id} className="space-y-1 px-4 py-3">
                    <p className="font-medium text-meridian-text">
                      {entry.action}
                    </p>
                    <p className="text-sm text-meridian-text-muted">
                      {formatWhen(entry.created_at)} · {entry.entity_type}
                      {entry.entity_id
                        ? ` · ${entry.entity_id.slice(0, 8)}…`
                        : ""}
                    </p>
                    <p className="text-sm text-meridian-text-muted">
                      {entry.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </Card>
    </main>
  );
}
