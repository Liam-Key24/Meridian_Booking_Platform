import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { signOut } from "@/lib/auth/actions";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { Button } from "@/components/ui";

export default async function DashboardPage() {
  const snapshot = await getAuthSnapshot();

  if (!snapshot) {
    redirect("/login");
  }

  const primary = snapshot.memberships[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="teal">Client dashboard</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            {primary ? primary.business.name : "Meridian"}
          </h1>
          <p className="text-meridian-text-muted">
            Signed in as {snapshot.user.email ?? "unknown"}. Booking tools arrive
            in a later phase — this shell confirms authentication and membership.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </header>

      {snapshot.memberships.length === 0 ? (
        <ErrorState
          title="No business membership"
          description="Your account is authenticated but not linked to an active business. Ask a Meridian admin or business owner to grant access."
        />
      ) : (
        <Card
          title="Your businesses"
          description="Membership is resolved server-side from Supabase Auth + RLS. Never trust a client-supplied business id alone."
        >
          <ul className="space-y-3">
            {snapshot.memberships.map(({ business, membership }) => (
              <li
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-meridian-sm border border-meridian-border bg-meridian-surface-muted px-4 py-3"
              >
                <div>
                  <p className="font-medium text-meridian-text">{business.name}</p>
                  <p className="text-sm text-meridian-text-muted">
                    /{business.slug} · role: {membership.role}
                  </p>
                </div>
                <Badge tone={membership.role === "owner" ? "teal" : "soft"}>
                  {membership.role}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Pending bookings"
        description="Placeholder queue. Public booking requests and approvals land in later phases."
      >
        <EmptyState
          title="No bookings to review"
          description="Tenant isolation is already enforced for businesses and memberships. Bookings will follow the same business_id + RLS pattern."
        />
      </Card>
    </main>
  );
}
