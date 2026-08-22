import { Badge, Card, EmptyState } from "@/components/ui";

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="space-y-2">
        <Badge tone="accent">Meridian admin</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Operations
        </h1>
        <p className="text-meridian-text-muted">
          Placeholder for business onboarding, memberships, and audit tools.
        </p>
      </header>

      <Card
        title="Businesses"
        description="Create and manage client businesses in a later phase."
      >
        <EmptyState
          title="Admin tools not connected"
          description="Phase 6 will add Meridian-admin-only controls for businesses, users, and support views."
        />
      </Card>
    </main>
  );
}
