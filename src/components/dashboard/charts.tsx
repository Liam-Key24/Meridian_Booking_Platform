import type {
  DayCount,
  ServiceCount,
  StatusCounts,
} from "@/lib/dashboard/analytics-math";

type ChartShellProps = {
  title: string;
  summary: string;
  rangeLabel: string;
  empty?: boolean;
  children: React.ReactNode;
};

function ChartShell({
  title,
  summary,
  rangeLabel,
  empty,
  children,
}: ChartShellProps) {
  return (
    <section className="rounded-meridian border border-meridian-border bg-meridian-surface p-5">
      <header className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-meridian-text">{title}</h2>
        <p className="text-xs text-meridian-text-muted">{rangeLabel}</p>
        <p className="sr-only">{summary}</p>
      </header>
      {empty ? (
        <p className="text-sm text-meridian-text-muted">No data in this range.</p>
      ) : (
        children
      )}
    </section>
  );
}

const statusColors: Record<string, string> = {
  pending: "#c47a12",
  confirmed: "#1a7a5c",
  declined: "#b42318",
  cancelled: "#5a7580",
};

export function StatusDistributionChart({
  data,
  rangeLabel,
}: {
  data: StatusCounts;
  rangeLabel: string;
}) {
  const entries = (
    ["pending", "confirmed", "declined", "cancelled"] as const
  ).map((key) => ({ key, value: data[key] }));
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  const summary = entries
    .map((item) => `${item.key}: ${item.value}`)
    .join(", ");

  return (
    <ChartShell
      title="Booking status distribution"
      summary={summary || "No statuses"}
      rangeLabel={rangeLabel}
      empty={total === 0}
    >
      <div className="space-y-3">
        {entries.map((item) => {
          const width =
            total === 0 ? 0 : Math.round((item.value / total) * 100);
          return (
            <div key={item.key} className="space-y-1">
              <div className="flex justify-between text-xs text-meridian-text-muted">
                <span className="capitalize">{item.key}</span>
                <span>
                  {item.value} ({width}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-meridian-surface-subtle">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${width}%`,
                    backgroundColor: statusColors[item.key],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartShell>
  );
}

export function RequestsByDayChart({
  data,
  rangeLabel,
  title = "Booking requests by day",
}: {
  data: DayCount[];
  rangeLabel: string;
  title?: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const height = 140;
  const width = Math.max(320, data.length * 18);
  const barWidth = Math.max(6, Math.floor(width / Math.max(data.length, 1)) - 4);

  return (
    <ChartShell
      title={title}
      summary={`Total ${total} across ${data.length} days`}
      rangeLabel={rangeLabel}
      empty={total === 0}
    >
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={title}
          viewBox={`0 0 ${width} ${height + 24}`}
          className="min-w-full"
        >
          {data.map((item, index) => {
            const barHeight = (item.count / max) * height;
            const x = index * (barWidth + 4);
            const y = height - barHeight;
            return (
              <g key={item.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="#489fb5"
                />
                {data.length <= 14 ? (
                  <text
                    x={x + barWidth / 2}
                    y={height + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#5a7580"
                  >
                    {item.date.slice(8)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </ChartShell>
  );
}

export function TopServicesChart({
  data,
  rangeLabel,
}: {
  data: ServiceCount[];
  rangeLabel: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Most requested services"
      summary={
        data.map((item) => `${item.name}: ${item.count}`).join(", ") ||
        "No services"
      }
      rangeLabel={rangeLabel}
      empty={total === 0}
    >
      <ul className="space-y-3">
        {data.map((item) => (
          <li key={`${item.serviceId}-${item.name}`} className="space-y-1">
            <div className="flex justify-between gap-3 text-sm">
              <span className="truncate font-medium text-meridian-text">
                {item.name}
              </span>
              <span className="text-meridian-text-muted">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-meridian-surface-subtle">
              <div
                className="h-2 rounded-full bg-meridian-soft-blue"
                style={{ width: `${Math.round((item.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ChartShell>
  );
}
