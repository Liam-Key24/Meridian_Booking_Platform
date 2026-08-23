import type {
  PeriodCount,
  ServiceCount,
  StatusCounts,
  DayCount,
  RequestsPeriod,
} from "@/lib/dashboard/analytics-math";
import { niceTableTicks } from "@/lib/dashboard/analytics-math";
import { cn } from "@/lib/cn";
import Link from "next/link";

type ChartShellProps = {
  title: string;
  summary: string;
  rangeLabel?: string;
  empty?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function ChartShell({
  title,
  summary,
  rangeLabel,
  empty,
  actions,
  children,
}: ChartShellProps) {
  return (
    <section className="rounded-meridian border border-meridian-border bg-meridian-surface p-5 shadow-[0_10px_30px_rgba(20,58,68,0.04)]">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-meridian-text">{title}</h2>
          {rangeLabel ? (
            <p className="text-xs text-meridian-text-muted">{rangeLabel}</p>
          ) : null}
          <p className="sr-only">{summary}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      {empty ? (
        <p className="py-10 text-center text-sm text-meridian-text-muted">
          No data in this range.
        </p>
      ) : (
        children
      )}
    </section>
  );
}

const statusColors: Record<string, string> = {
  pending: "#FFA62B",
  confirmed: "#16697A",
  declined: "#489FB5",
  cancelled: "#82C0CC",
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArc,
    0,
    end.x,
    end.y,
    "L",
    cx,
    cy,
    "Z",
  ].join(" ");
}

export function StatusDistributionChart({
  data,
  rangeLabel,
}: {
  data: StatusCounts;
  rangeLabel: string;
}) {
  const entries = (
    ["pending", "confirmed", "declined", "cancelled"] as const
  ).map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: data[key],
    color: statusColors[key],
  }));
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  const summary = entries
    .map((item) => `${item.label}: ${item.value}`)
    .join(", ");

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  let angle = 0;
  const slices =
    total === 0
      ? []
      : entries
          .filter((item) => item.value > 0)
          .map((item) => {
            const sweep = (item.value / total) * 360;
            const start = angle;
            const end = angle + sweep;
            angle = end;
            return {
              ...item,
              path:
                sweep >= 359.9
                  ? undefined
                  : describeArc(cx, cy, radius, start, end),
              full: sweep >= 359.9,
              percent: Math.round((item.value / total) * 100),
            };
          });

  return (
    <ChartShell
      title="Booking status distribution"
      summary={summary || "No statuses"}
      rangeLabel={rangeLabel}
      empty={total === 0}
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          role="img"
          aria-label="Booking status pie chart"
          viewBox={`0 0 ${size} ${size}`}
          className="h-52 w-52 drop-shadow-[0_12px_18px_rgba(22,105,122,0.18)]"
        >
          <circle cx={cx} cy={cy + 4} r={radius} fill="rgba(22,105,122,0.08)" />
          {slices.map((slice) =>
            slice.full ? (
              <circle
                key={slice.key}
                cx={cx}
                cy={cy}
                r={radius}
                fill={slice.color}
              />
            ) : (
              <path key={slice.key} d={slice.path} fill={slice.color} />
            ),
          )}
          <circle cx={cx} cy={cy} r={42} fill="#ffffff" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-meridian-text"
            fontSize="22"
            fontWeight="700"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill="#5a7580"
            fontSize="11"
          >
            bookings
          </text>
        </svg>
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {entries.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 text-sm text-meridian-text"
            >
              <span
                className="size-3 rounded-[4px]"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span>{item.label}</span>
              <span className="text-meridian-text-muted">
                {item.value}
                {total > 0
                  ? ` (${Math.round((item.value / total) * 100)}%)`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartShell>
  );
}

export function RequestsPeriodToggle({
  period,
  week,
}: {
  period: RequestsPeriod;
  week?: string;
}) {
  const options: RequestsPeriod[] = ["daily", "weekly", "monthly"];
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-meridian-text-muted sm:inline">
        View:
      </span>
      <div
        className="inline-flex rounded-meridian-sm border border-meridian-border bg-meridian-surface p-0.5"
        role="group"
        aria-label="Booking requests period"
      >
        {options.map((option) => {
          const href =
            week != null
              ? `/dashboard?period=${option}&week=${week}`
              : `/dashboard?period=${option}`;
          const active = period === option;
          return (
            <Link
              key={option}
              href={href}
              className={cn(
                "rounded-[10px] px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                active
                  ? "bg-meridian-accent text-meridian-text"
                  : "text-meridian-text-muted hover:text-meridian-text",
              )}
              aria-current={active ? "true" : undefined}
            >
              {option}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function RequestsByDayChart({
  data,
  rangeLabel,
  title = "Booking requests by day",
  period,
  week,
  yAxisLabel = "Tables",
}: {
  data: PeriodCount[] | DayCount[];
  rangeLabel: string;
  title?: string;
  period?: RequestsPeriod;
  week?: string;
  yAxisLabel?: string;
}) {
  const series: PeriodCount[] = data.map((item) =>
    "label" in item
      ? item
      : {
          key: item.date,
          label: item.date.slice(8),
          count: item.count,
        },
  );
  const total = series.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(0, ...series.map((item) => item.count));
  const ticks = niceTableTicks(maxCount);
  const yMax = ticks[ticks.length - 1] ?? 1;

  const chartWidth = 420;
  const chartHeight = 200;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;
  const slot = plotWidth / Math.max(series.length, 1);
  const barWidth = Math.min(36, Math.max(14, slot * 0.55));

  return (
    <ChartShell
      title={title}
      summary={`Total ${total} table bookings across ${series.length} periods`}
      rangeLabel={rangeLabel}
      empty={false}
      actions={
        period ? (
          <RequestsPeriodToggle period={period} week={week} />
        ) : undefined
      }
    >
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-meridian-text-muted">
          No data in this range.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label={`${title}. ${yAxisLabel} from 0 to ${yMax}.`}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-full"
          >
            {ticks.map((tick) => {
              const y =
                padTop + plotHeight - (tick / yMax) * plotHeight;
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    x2={chartWidth - padRight}
                    y1={y}
                    y2={y}
                    stroke="#d7e4e8"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#5a7580"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
            <text
              x={12}
              y={padTop + plotHeight / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#5a7580"
              transform={`rotate(-90 12 ${padTop + plotHeight / 2})`}
            >
              {yAxisLabel}
            </text>
            {series.map((item, index) => {
              const cx = padLeft + slot * index + slot / 2;
              const trackX = cx - barWidth / 2;
              const valueHeight = (item.count / yMax) * plotHeight;
              const valueY = padTop + plotHeight - valueHeight;
              return (
                <g key={item.key}>
                  <rect
                    x={trackX}
                    y={padTop}
                    width={barWidth}
                    height={plotHeight}
                    rx={10}
                    fill="#dceef2"
                  />
                  <rect
                    x={trackX}
                    y={valueY}
                    width={barWidth}
                    height={Math.max(item.count > 0 ? 6 : 0, valueHeight)}
                    rx={10}
                    fill="#16697A"
                  />
                  <text
                    x={cx}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#5a7580"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
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
