import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessSettingsNav } from "@/components/admin/business-settings-nav";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import {
  DASHBOARD_MODE_LABELS,
} from "@/lib/business/modes";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMode } from "@/types/database";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function BusinessSettingsLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  await requireMeridianAdmin();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status, dashboard_mode")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    notFound();
  }

  const mode =
    (business.dashboard_mode as DashboardMode | undefined) ?? "hospitality";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-[var(--meridian-space-page)] py-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/admin/businesses/${business.id}`}
            className="font-medium text-meridian-accent hover:underline"
          >
            ← Usage overview
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-meridian-text-muted uppercase">
            Settings · {DASHBOARD_MODE_LABELS[mode]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-meridian-text sm:text-3xl">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-meridian-text-muted">
            /{business.slug} · {business.status}
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <BusinessSettingsNav businessId={business.id} mode={mode} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
