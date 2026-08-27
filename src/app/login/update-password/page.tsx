import { redirect } from "next/navigation";
import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { PASSWORD_RESET_HREF } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(PASSWORD_RESET_HREF);
  }

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <section className="relative flex flex-1 flex-col justify-between bg-meridian-surface px-[var(--meridian-space-page)] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-3"
                aria-label="Meridian sign in"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse"
                >
                  M
                </span>
                <p className="text-lg font-semibold tracking-tight text-meridian-text">
                  Meridian
                </p>
              </Link>
            </div>

            <header className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-meridian-text sm:text-4xl">
                Choose a new password
              </h1>
              <p className="text-sm leading-relaxed text-meridian-text-muted sm:text-base">
                Enter a new password for your account, then continue to your
                dashboard.
              </p>
            </header>

            <UpdatePasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
