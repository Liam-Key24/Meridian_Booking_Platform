import Link from "next/link";
import { CreateBusinessForm } from "@/components/admin/business-forms";
import { Badge, Card } from "@/components/ui";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";

export default async function NewBusinessPage() {
  await requireMeridianAdmin();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm font-semibold text-meridian-teal hover:underline"
        >
          ← Businesses
        </Link>
        <Badge tone="accent">Onboarding</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-meridian-text">
          Create business
        </h1>
        <p className="text-meridian-text-muted">
          Creates the tenant row and default Meridian booking settings.
        </p>
      </div>
      <Card title="Business details">
        <CreateBusinessForm />
      </Card>
    </main>
  );
}
