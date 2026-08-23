import { ManualBookingForm } from "@/components/dashboard/manual-booking-form";
import { ErrorState } from "@/components/ui";
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
      <main className="flex w-full flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-8">
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
    <main className="flex w-full flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-6 lg:py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Add a booking
        </h1>
        <p className="text-meridian-text-muted">
          Create a confirmed booking for a customer who booked outside the public
          request form.
        </p>
      </header>

      <ManualBookingForm
        businessId={context.business.id}
        services={services ?? []}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />
    </main>
  );
}
