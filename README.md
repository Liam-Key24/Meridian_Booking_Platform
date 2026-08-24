# Meridian Booking Platform

Secure, multi-tenant booking-request product used by Meridian client sites. The marketing website is separate; this repository is the shared booking platform only.

> **Supabase project:** use **Meridian Platform Development** only.  
> Never connect to, alter, or reuse the Meridian Marketing Supabase project.  
> **Never commit secrets** (`.env.local`, service-role keys, publishable keys with real values, passwords).

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** with Meridian design tokens (`#16697A`, `#489FB5`, `#82C0CC`, `#FFA62B`, Plus Jakarta Sans)
- **Supabase** (Auth, Postgres, RLS) — Meridian Platform Development
- **Resend** — transactional booking emails (optional locally; required in production)
- **Upstash Redis** (`@upstash/ratelimit`) — durable public booking rate limits (in-memory only locally; fail closed in production)
- **Cloudflare Turnstile** — anonymous public booking bot protection (edge WAF is separate; see `docs/cloudflare.md`)

## Current status

Platform work through **hardening**, **dashboard analytics**, and **controlled templates** is implemented on feature branches (merge in order; do not assume `main` is current until merged):

### Booking (public + client)

- Public booking requests with validation, honeypot, idempotency keys, Turnstile, and durable rate limiting
- Client authentication and multi-tenant businesses / memberships
- Dashboard: pending queue, booking list/filters/detail, approve / decline / suggest-time / cancel
- Internal calendar with day/week navigation
- Booking modes: Meridian, external, hybrid (external URLs validated server-side)
- Real dashboard analytics and charts from Supabase (no fabricated metrics)
- Responsive sidebar shell (drawer on mobile)

### Admin (Meridian)

- Meridian admin routes (businesses, memberships, services, booking settings)
- Booking CSV export, audit logs, email-delivery logs with safe retry
- Controlled site-template registry and business assignment
- Safe template preview (`/preview/[businessSlug]`) — no publish without an assigned active template

### Still out of scope

Google Calendar sync, Stripe / payments, SMS, live availability APIs, drag-and-drop site editors, and other external booking providers beyond a validated external URL.

## Local setup

### Requirements

- Node.js 20+
- npm 10+
- Supabase CLI access to **Meridian Platform Development**

### Install

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` from Meridian Platform Development only. See [docs/operations.md](docs/operations.md) for production variables (Upstash, Turnstile, Resend).

### Link Supabase and apply migrations

```bash
npx supabase login
npx supabase link --project-ref <MERIDIAN_PLATFORM_DEVELOPMENT_PROJECT_REF>
npx supabase db push
```

Confirm the linked project name is **Meridian Platform Development** before any remote command. Migrations live under `supabase/migrations/` — never edit already-applied files; add a new migration instead.

Local Docker alternative:

```bash
npx supabase start
npx supabase db reset
```

### Develop / verify

```bash
npm run dev
npm run lint
npm test
npm run build
```

RLS / tenant isolation procedures: [docs/tenant-isolation.md](docs/tenant-isolation.md).  
Runbook (env, Resend, Upstash, Turnstile, email retry, templates, backups): [docs/operations.md](docs/operations.md).  
Cloudflare edge setup: [docs/cloudflare.md](docs/cloudflare.md).  
Production checklist: [docs/production-readiness.md](docs/production-readiness.md).

## Feature branch merge order

1. `codex/meridian-platform-security-foundation`
2. `codex/meridian-platform-domain-foundation`
3. `codex/meridian-platform-production-readiness`

Do not merge from older stale branches once these land.

## Tenant model

```text
User → Membership → Business → Bookings / services / settings / template assignment
```

Roles: `owner`, `staff` (membership) and `meridian_admin` (platform profile role).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Meridian Platform Development URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key (RLS-scoped) |
| `NEXT_PUBLIC_SITE_URL` | App origin |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never `NEXT_PUBLIC_` |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email (server-only) |
| `TURNSTILE_SECRET_KEY` | Turnstile verify (server-only) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Durable rate limit (server-only) |
| `BOOKING_RATE_LIMIT_SECRET` | HMAC secret for rate-limit identifiers (server-only) |
| `TRUSTED_PROXY` | `cloudflare` \| `vercel` \| `none` |

Local-only: `BOOKING_TURNSTILE_BYPASS=true` (never in production). Without Upstash locally, rate limiting falls back to in-memory (documented; not multi-instance safe). Production rejects public booking mutations if Upstash or the HMAC secret is missing.

## License

Private — Meridian internal use.
