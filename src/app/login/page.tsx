import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = getSafeRedirectPath(rawNext);

  return (
    <main className="flex min-h-full flex-1 flex-col lg:flex-row">
      <section className="relative flex flex-1 flex-col justify-between bg-meridian-surface px-[var(--meridian-space-page)] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-meridian-sm bg-meridian-teal text-sm font-bold text-meridian-text-inverse"
              >
                M
              </span>
              <p className="text-lg font-semibold tracking-tight text-meridian-text">
                Meridian
              </p>
            </div>

            <header className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-meridian-text sm:text-4xl">
                Welcome back
              </h1>
              <p className="text-sm leading-relaxed text-meridian-text-muted sm:text-base">
                Sign in to manage your bookings, requests, and business details.
              </p>
            </header>

            <LoginForm next={next} />
          </div>
        </div>

        <footer className="mx-auto mt-12 flex w-full max-w-md items-center justify-between gap-4 text-xs text-meridian-text-muted">
          <p>© {new Date().getFullYear()} Meridian</p>
          <p>Secure shared access</p>
        </footer>
      </section>

      <aside
        aria-label="Meridian product"
        className="relative hidden overflow-hidden bg-meridian-teal px-[var(--meridian-space-page)] py-16 text-meridian-text-inverse lg:flex lg:w-1/2 lg:flex-col lg:justify-center"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-72 rounded-full bg-meridian-blue/35 blur-2xl" />
          <div className="absolute top-1/3 -left-20 size-64 rotate-12 rounded-[2rem] bg-meridian-soft-blue/25" />
          <div className="absolute right-16 bottom-20 size-40 rounded-full border border-white/15 bg-white/5" />
          <div className="absolute bottom-28 left-1/3 size-24 rounded-meridian bg-meridian-accent/25" />
        </div>

        <div className="relative mx-auto max-w-md space-y-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-meridian-soft-blue uppercase">
            Meridian
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            One calm place for the bookings that keep your business moving.
          </h2>
          <p className="text-base leading-relaxed text-meridian-soft-blue">
            Review requests, confirm appointments, and keep operations tidy —
            whether you run a client business or support the platform.
          </p>
        </div>
      </aside>
    </main>
  );
}
