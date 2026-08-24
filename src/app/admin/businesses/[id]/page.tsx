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
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
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
  return new Date(value).toLocaleString();
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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
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
    supabase
      .from("services")
      .select("*")
      .eq("business_id", id)
      .order("name"),
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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm font-semibold text-meridian-teal hover:underline"
        >
          ← Businesses
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent">Business</Badge>
          <Badge tone={business.status === "active" ? "teal" : "soft"}>
            {business.status}
          </Badge>
          <Badge tone="soft">
            {DASHBOARD_MODE_LABELS[dashboardMode] ?? "Hospitality"}
          </Badge>
          {business.business_type ? (
            <Badge tone="soft">
              {BUSINESS_TYPE_LABELS[business.business_type as BusinessType] ??
                business.business_type}
            </Badge>
          ) : null}
          <Badge tone="soft">
            {SUBSCRIPTION_STATUS_LABELS[subscriptionStatus]}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          {business.name}
        </h1>
        <p className="text-meridian-text-muted">
          Slug <code className="text-meridian-text">{business.slug}</code> ·{" "}
          <Link
            href={`/book/${business.slug}`}
            className="font-semibold text-meridian-teal hover:underline"
          >
            Public book page
          </Link>
          {" · "}
          <Link
            href={`/admin/bookings?businessId=${business.id}`}
            className="font-semibold text-meridian-teal hover:underline"
          >
            Bookings
          </Link>
          {" · "}
          <a
            href={`/admin/bookings/export?businessId=${business.id}`}
            className="font-semibold text-meridian-teal hover:underline"
          >
            Export CSV
          </a>
        </p>
      </div>

      <Card
        title="Operational metrics"
        description="Volumes and activity only — no customer contact details."
      >
        {metrics ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-meridian-text-muted">Bookings</dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.bookingVolume}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-meridian-text-muted">Confirmed</dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.confirmedVolume}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-meridian-text-muted">Cancelled</dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.cancellationVolume}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-meridian-text-muted">No-show</dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.noShowVolume}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-meridian-text-muted">Pending</dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.pendingVolume}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-meridian-text-muted">
                Email activity (recent)
              </dt>
              <dd className="text-lg font-semibold text-meridian-text">
                {metrics.emailSent} sent · {metrics.emailFailed} failed ·{" "}
                {metrics.emailTotal} sampled
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-meridian-text-muted">Last activity</dt>
              <dd className="text-sm text-meridian-text">
                {formatWhen(metrics.lastActivityAt)}
                <span className="text-meridian-text-muted">
                  {" "}
                  (booking {formatWhen(metrics.lastBookingAt)} · email{" "}
                  {formatWhen(metrics.lastEmailAt)} · audit{" "}
                  {formatWhen(metrics.lastAuditAt)})
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-meridian-status-declined">
            Could not load operational metrics.
          </p>
        )}
      </Card>

      <Card title="Status" description="Suspend or reactivate this tenant.">
        <BusinessStatusForm businessId={business.id} status={business.status} />
      </Card>

      <Card
        title="Subscription"
        description="Internal status only. No payment processing in this phase."
      >
        <BusinessSubscriptionForm
          businessId={business.id}
          subscriptionStatus={subscriptionStatus}
        />
      </Card>

      <Card
        title="Dashboard mode"
        description="Type and mode are server-authoritative. Capability defaults reset when mode changes."
      >
        <BusinessDashboardModeForm
          businessId={business.id}
          businessType={(business.business_type as BusinessType | null) ?? null}
          dashboardMode={dashboardMode}
        />
      </Card>

      <Card
        title="Capabilities"
        description="Toggle allowlisted features for this business. Changes are audited."
      >
        <BusinessCapabilitiesForm
          businessId={business.id}
          capabilities={capabilities}
        />
      </Card>

      <Card
        title="Audit history"
        description="Recent privileged changes for this business (no customer PII)."
      >
        {auditError ? (
          <p className="text-sm text-meridian-status-declined">{auditError}</p>
        ) : auditHistory.length === 0 ? (
          <EmptyState
            title="No audit entries"
            description="Admin and booking decisions for this business will appear here."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {auditHistory.map((entry) => (
              <li key={entry.id} className="space-y-1 py-3">
                <p className="font-medium text-meridian-text">{entry.action}</p>
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
      </Card>

      <Card title="Members">
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
                    className="rounded-meridian border border-meridian-border p-4"
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
      </Card>

      <Card title="Site template">
        <AdminTemplateAssignForm
          businessId={business.id}
          businessSlug={business.slug}
          assignedTemplateId={assignment?.template_id ?? null}
          templates={templates ?? []}
        />
      </Card>

      <Card title="Booking settings">
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
      </Card>

      <Card title="Services">
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
      </Card>
    </main>
  );
}
