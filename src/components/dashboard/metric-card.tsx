import Link from "next/link";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: number;
  rangeLabel: string;
  href: string;
  tone?: "teal" | "blue" | "accent" | "muted";
};

const tones = {
  teal: "text-meridian-teal",
  blue: "text-meridian-blue",
  accent: "text-[#9a5b00]",
  muted: "text-meridian-text-muted",
};

export function MetricCard({
  label,
  value,
  rangeLabel,
  href,
  tone = "teal",
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
          {label}
        </p>
        <p className={cn("text-3xl font-semibold tracking-tight", tones[tone])}>
          {value}
        </p>
        <p className="text-xs text-meridian-text-muted">{rangeLabel}</p>
        <Link
          href={href}
          className="inline-block text-sm font-semibold text-meridian-teal hover:underline"
        >
          View details
        </Link>
      </div>
    </Card>
  );
}
