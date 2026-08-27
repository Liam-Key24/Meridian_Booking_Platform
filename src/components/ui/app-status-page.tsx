import Link from "next/link";
import { cn } from "@/lib/cn";

export type AppStatusPageProps = {
  code: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  digest?: string;
  className?: string;
};

const primaryClassName =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse hover:bg-[#125a69]";

const secondaryClassName =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-meridian border border-meridian-border bg-meridian-surface px-5 text-sm font-semibold text-meridian-text hover:border-meridian-accent";

export function AppStatusPage({
  code,
  title,
  description,
  primaryHref = "/login",
  primaryLabel = "Go to sign in",
  onPrimaryAction,
  primaryActionLabel = "Try again",
  secondaryHref,
  secondaryLabel,
  digest,
  className,
}: AppStatusPageProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-[var(--meridian-space-page)] py-16",
        className,
      )}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse"
          >
            M
          </span>
          <p className="text-lg font-semibold tracking-tight text-meridian-text">
            Meridian
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-meridian-blue uppercase">
            {code}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-meridian-text-muted sm:text-base">
            {description}
          </p>
          {digest ? (
            <p className="text-xs text-meridian-text-muted">
              Reference: <span className="font-mono">{digest}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {onPrimaryAction ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className={primaryClassName}
            >
              {primaryActionLabel}
            </button>
          ) : (
            <Link href={primaryHref} className={primaryClassName}>
              {primaryLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className={secondaryClassName}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
