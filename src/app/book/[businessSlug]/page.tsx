import {
  Badge,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Select,
  StatusLabel,
  Textarea,
} from "@/components/ui";

type BookPageProps = {
  params: Promise<{ businessSlug: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { businessSlug } = await params;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-14">
      <header className="space-y-3">
        <Badge tone="soft">Public booking</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Request a booking
        </h1>
        <p className="text-meridian-text-muted">
          Placeholder for{" "}
          <span className="font-medium text-meridian-text">{businessSlug}</span>
          . The secure request form lands in a later phase.
        </p>
      </header>

      <Card
        title="Booking request form"
        description="Fields mirror the planned public request workflow. Submissions are not enabled yet."
      >
        <div className="space-y-4">
          <Input label="Name" name="name" placeholder="Your name" disabled />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            disabled
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+44…"
            disabled
          />
          <Select
            label="Service"
            name="service"
            placeholder="Select a service"
            disabled
            options={[{ value: "placeholder", label: "Coming soon" }]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Preferred date" name="date" type="date" disabled />
            <Input label="Preferred time" name="time" type="time" disabled />
          </div>
          <Input
            label="Guest count (optional)"
            name="guests"
            type="number"
            disabled
          />
          <Textarea
            label="Notes (optional)"
            name="notes"
            placeholder="Anything we should know?"
            disabled
          />
          <div className="flex items-center gap-2 pt-2">
            <StatusLabel status="pending" />
            <span className="text-sm text-meridian-text-muted">
              Requests will start as Pending
            </span>
          </div>
        </div>
      </Card>

      <EmptyState
        title="Form not live yet"
        description="Phase 2 will connect this route to validated, rate-limited booking requests."
      />

      <LoadingState label="UI loading state preview" className="py-4" />
    </main>
  );
}
