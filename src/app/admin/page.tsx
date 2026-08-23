import { redirect } from "next/navigation";
import { Badge, Card, EmptyState, ErrorState } from "@/components/ui";
import { getAuthSnapshot } from "@/lib/auth/business-context";

export default async function AdminPage() {
  const snapshot = await getAuthSnapshot();

  if (!snapshot) {
    redirect("/login");
  }

  if (!snapshot.isMeridianAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <ErrorState
          title="Meridian admin only"
          description="Platform administration is separate from business membership. Your account does not have meridian_admin platform role."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Meridian admin</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Operations
        </h1>
        <p className="text-meridian-text-muted">
          Authenticated as platform admin. Business onboarding tools arrive later.
          Broad write bypass policies are intentionally limited in Phase 1.
        </p>
      </header>

      <Card title="Businesses" description="Management UI lands in a later phase.">
        <EmptyState
          title="Admin tools not connected"
          description="You can read tenant data via RLS as meridian_admin; creation workflows and support views come later."
        />
      </Card>
    </main>
  );
}
