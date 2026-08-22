import {
  Badge,
  Card,
  EmptyState,
  StatusLabel,
} from "@/components/ui";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="teal">Client dashboard</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Pending bookings
          </h1>
          <p className="text-meridian-text-muted">
            Placeholder queue. Authentication and RLS-backed data arrive later.
          </p>
        </div>
        <StatusLabel status="pending" />
      </header>

      <Card
        title="Booking queue"
        description="Approve, decline, and suggest another time will live here."
      >
        <EmptyState
          title="No bookings to review"
          description="When clients submit requests, pending items will appear in this queue."
        />
      </Card>
    </main>
  );
}
