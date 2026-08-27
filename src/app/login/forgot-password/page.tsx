import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
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
                Reset your password
              </h1>
              <p className="text-sm leading-relaxed text-meridian-text-muted sm:text-base">
                Enter the email for your Meridian account. We will send a link
                to choose a new password.
              </p>
            </header>

            <ForgotPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
