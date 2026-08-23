import Link from "next/link";
import {
  AddMembershipForm,
  AdminServiceForm,
  AdminSettingsForm,
  BusinessStatusForm,
  MembershipRowForm,
} from "@/components/admin/business-forms";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

  const [{ data: settings }, { data: membershipRows }, { data: services }] =
    await Promise.all([
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
    ]);

  const userIds = (membershipRows ?? []).map((row) => row.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)
      : { data: [] as Array<{ id: string; email: string; full_name: string | null }> };

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

      <Card title="Status">
        <BusinessStatusForm businessId={business.id} status={business.status} />
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
