# Meridian Booking Platform

Secure, multi-tenant booking-request product used by Meridian client sites. The marketing website is separate; this repository is the shared booking platform only.

> **Supabase project:** use **Meridian Platform Development** only.  
> Never connect to, alter, or reuse the Meridian Marketing Supabase project.  
> **Never commit secrets** (`.env.local`, service-role keys, publishable keys with real values, passwords).

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** with Meridian design tokens
- **Supabase** (Auth, Postgres, RLS) — Meridian Platform Development
- Transactional email / Stripe — later phases (not installed)

## Current status

**Phase 0** foundation and **Phase 1** multi-tenant security are in progress on feature branches:

- Design tokens and UI primitives
- Route placeholders + authenticated dashboard shell
- `businesses`, `profiles`, `business_memberships`
- RLS + two-business isolation tests
- Stripe-ready architecture documentation (no Stripe SDK)

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

Fill `.env.local` from Meridian Platform Development only.

### Link Supabase

```bash
npx supabase login
npx supabase link --project-ref <MERIDIAN_PLATFORM_DEVELOPMENT_PROJECT_REF>
npx supabase db push
```

Confirm the linked project name is **Meridian Platform Development** before any remote command.

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

See [docs/architecture.md](docs/architecture.md) and [docs/tenant-isolation.md](docs/tenant-isolation.md).

## Tenant model (Phase 1)

```text
User → Membership → Business → Business-owned records (future)
```

Roles: `owner`, `staff` (membership) and `meridian_admin` (platform profile role).

## Out of scope (later)

Bookings, emails, Stripe SDK/Checkout/Connect, payments, calendar sync, Google APIs, live availability, SMS, floor plans.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Meridian Platform Development URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key (RLS-scoped) |
| `NEXT_PUBLIC_SITE_URL` | App origin |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never `NEXT_PUBLIC_` |

## License

Private — Meridian internal use.
