import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBusinessesPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, slug, status, created_at")
    .order("name");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="accent">Meridian admin</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
            Businesses
          </h1>
          <p className="text-meridian-text-muted">
            Platform-level tenant list. Access is gated by meridian_admin and RLS.
          </p>
        </div>
        <Link
          href="/admin/businesses/new"
          className="inline-flex h-11 items-center justify-center rounded-meridian bg-meridian-teal px-5 text-sm font-semibold text-meridian-text-inverse"
        >
          New business
        </Link>
      </header>

      <Card title="All businesses" description={`${businesses?.length ?? 0} total`}>
        {error ? (
          <p className="text-sm text-meridian-status-declined">
            Could not load businesses.
          </p>
        ) : !businesses?.length ? (
          <EmptyState
            title="No businesses yet"
            description="Create the first client business to begin onboarding."
          />
        ) : (
          <ul className="divide-y divide-meridian-border">
            {businesses.map((business) => (
              <li
                key={business.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/businesses/${business.id}`}
                    className="font-semibold text-meridian-text hover:text-meridian-teal"
                  >
                    {business.name}
                  </Link>
                  <p className="text-sm text-meridian-text-muted">
                    /book/{business.slug}
                  </p>
                </div>
                <Badge tone={business.status === "active" ? "teal" : "soft"}>
                  {business.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
