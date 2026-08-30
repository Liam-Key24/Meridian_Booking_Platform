import {
  MARKETING_PRIVACY_URL,
  MARKETING_TERMS_URL,
} from "@/lib/marketing-links";
import { cn } from "@/lib/cn";
import { CLIENT_SURFACE_MUTED } from "@/lib/templates/client-surface-theme";

export function BookingLegalNotice({ embed = false }: { embed?: boolean }) {
  const linkClass = embed
    ? "underline underline-offset-2 text-[var(--client-accent)] hover:opacity-80"
    : "underline underline-offset-2 text-meridian-teal hover:text-meridian-text";

  return (
    <p
      className={cn(
        "text-xs leading-relaxed",
        embed ? CLIENT_SURFACE_MUTED : "text-meridian-text-muted",
      )}
    >
      By submitting, you agree to our{" "}
      <a
        href={MARKETING_TERMS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Terms
      </a>{" "}
      and{" "}
      <a
        href={MARKETING_PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Privacy Policy
      </a>
      , which explain how we use your booking details.
    </p>
  );
}
