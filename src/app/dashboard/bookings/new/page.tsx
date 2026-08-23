import Link from "next/link";
import { ManualBookingForm } from "@/components/dashboard/manual-booking-form";
import { Badge, Card, ErrorState } from "@/components/ui";
import { requireDashboardContext } from "@/lib/dashboard/require-context";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    time?: string;
  }>;
};

export default async function NewManualBookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireDashboardContext();

  if (!context) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
        <ErrorState
          title="No business membership"
          description="Your account is signed in but not linked to an active business."
        />
      </main>
    );
  }

  const defaultDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : undefined;
  const defaultTime =
    params.time && /^\d{2}:\d{2}/.test(params.time)
      ? params.time.slice(0, 5)
      : undefined;

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .eq("business_id", context.business.id)
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <div className="space-y-2">
        <Link
          href="/dashboard/calendar"
          className="text-sm font-semibold text-meridian-teal hover:underline"
        >
          ← Calendar
        </Link>
        <Badge tone="teal">Manual booking</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Add a booking
        </h1>
        <p className="max-w-xl text-meridian-text-muted">
          Create a confirmed booking for a customer who booked outside the public
          request form. You can also start from the calendar.
        </p>
      </div>

      <Card title="Booking details">
        <ManualBookingForm
          businessId={context.business.id}
          services={services ?? []}
          defaultDate={defaultDate}
          defaultTime={defaultTime}
        />
      </Card>
    </main>
  );
}
