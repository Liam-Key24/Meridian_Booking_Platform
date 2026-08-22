import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-[var(--meridian-space-page)] py-16">
      <header className="space-y-4">
        <Badge tone="teal">Meridian Booking Platform</Badge>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-meridian-text sm:text-5xl">
          Meridian
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-meridian-text-muted sm:text-lg">
          Shared booking-request platform for Meridian client sites. Simple
          requests, clear decisions, and confirmed bookings — without live
          availability or payment complexity in this foundation phase.
        </p>
      </header>

      <Card
        title="Route placeholders"
        description="Foundation routes for later phases. No booking logic is wired yet."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/book/demo-salon", label: "Public booking form" },
            { href: "/login", label: "Client login" },
            { href: "/dashboard", label: "Client dashboard" },
            { href: "/admin", label: "Meridian admin" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-meridian-sm border border-meridian-border bg-meridian-surface-muted px-4 py-3 text-sm font-medium text-meridian-text transition-colors hover:border-meridian-soft-blue hover:bg-meridian-surface"
              >
                <span>{item.label}</span>
                <span className="text-meridian-text-muted">{item.href}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button disabled>Booking flow coming soon</Button>
        <Button variant="secondary" disabled>
          Design tokens active
        </Button>
      </div>
    </main>
  );
}
