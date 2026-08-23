import { EmptyState, ErrorState } from "@/components/ui";
import {
  BookingsExplorer,
  type BookingsPeriod,
} from "@/components/dashboard/bookings-explorer";
import {
  listBookingsForBusiness,
  type BookingFilters as Filters,
} from "@/lib/dashboard/bookings";
import { resolveWeekRange } from "@/lib/dashboard/analytics-math";
import { formatLocalDate } from "@/lib/dashboard/calendar";
import { requireDashboardContext } from "@/lib/dashboard/require-context";
import type { BookingStatus } from "@/types/database";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    q?: string;
    period?: string;
  }>;
};

function parseStatus(value?: string): Filters["status"] {
  const allowed: Array<BookingStatus | "all"> = [
    "all",
    "pending",
    "confirmed",
    "declined",
    "cancelled",
    "suggested",
  ];
  if (value && allowed.includes(value as BookingStatus | "all")) {
    return value as BookingStatus | "all";
  }
  return "all";
}

function parsePeriod(value?: string): BookingsPeriod {
  if (
    value === "daily" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "custom"
  ) {
    return value;
  }
  return "weekly";
}

function resolveListRange(
  period: BookingsPeriod,
  fromParam: string,
  toParam: string,
): { from?: string; to?: string } {
  if (period === "custom") {
    return {
      from: fromParam || undefined,
      to: toParam || undefined,
    };
  }
  if (period === "daily") {
    const today = formatLocalDate(new Date());
    return { from: today, to: today };
  }
  if (period === "weekly") {
    const week = resolveWeekRange();
    return { from: week.from, to: week.to };
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 12);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
  return { from: formatLocalDate(start), to: formatLocalDate(end) };
}

export default async function DashboardBookingsPage({ searchParams }: PageProps) {
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

  const period = parsePeriod(params.period);
  const status = parseStatus(params.status);
  const fromParam = params.from ?? "";
  const toParam = params.to ?? "";
  const q = params.q?.trim() ?? "";
  const range = resolveListRange(period, fromParam, toParam);

  const { data: bookings, error } = await listBookingsForBusiness(
    context.business.id,
    {
      status,
      from: range.from,
      to: range.to,
      q: q || undefined,
    },
  );

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          All bookings
        </h1>
      </header>

      {error && bookings.length === 0 ? (
        <EmptyState
          title="Could not load bookings"
          description={error}
        />
      ) : (
        <BookingsExplorer
          businessId={context.business.id}
          bookings={bookings}
          period={period}
          status={status ?? "all"}
          from={period === "custom" ? fromParam : range.from ?? ""}
          to={period === "custom" ? toParam : range.to ?? ""}
          q={q}
          error={error}
        />
      )}
    </main>
  );
}
