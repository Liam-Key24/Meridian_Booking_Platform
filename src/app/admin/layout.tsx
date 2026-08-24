import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ErrorState } from "@/components/ui";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    redirect("/login?next=/admin");
  }

  if (!snapshot.isMeridianAdmin) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-[var(--meridian-space-page)] py-12">
          <ErrorState
            title="Meridian admin only"
            description="Platform administration is separate from business membership. Your account does not have the meridian_admin platform role."
          />
          <p className="text-center text-sm">
            <Link
              href="/dashboard"
              className="font-semibold text-meridian-accent hover:underline"
            >
              Back to dashboard
            </Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <AdminShell accountEmail={snapshot.user.email ?? snapshot.profile?.email ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
