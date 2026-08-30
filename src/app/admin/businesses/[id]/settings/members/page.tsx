import { notFound } from "next/navigation";
import {
  AddMembershipForm,
  MembershipRowForm,
} from "@/components/admin/business-forms";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessMembersSettingsPage({ params }: PageProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!business) notFound();

  const { data: membershipRows } = await supabase
    .from("business_memberships")
    .select("id, role, status, user_id")
    .eq("business_id", id)
    .order("created_at");

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
    <SettingsPanel
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
    </SettingsPanel>
  );
}
