import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import { Button, ErrorState } from "@/components/ui";
import { redirect } from "next/navigation";

const nav = [
  { href: "/admin", label: "Businesses" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/audit-logs", label: "Audit logs" },
  { href: "/admin/email-logs", label: "Email logs" },
];

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
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-meridian-border bg-meridian-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-[var(--meridian-space-page)] py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-meridian-accent uppercase">
              Meridian admin
            </p>
            <p className="text-lg font-semibold text-meridian-text">
              Platform operations
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-meridian-sm px-3 py-2 text-sm font-medium text-meridian-text-muted transition-colors hover:bg-meridian-surface-muted hover:text-meridian-text"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOut}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
