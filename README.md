# Meridian Booking Platform

Secure, multi-tenant booking-request product used by Meridian client sites. The marketing website is separate; this repository is the shared booking platform only.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** with Meridian design tokens
- **Supabase** (Auth, Postgres, RLS) — schema + RLS in Phase 1
- **Resend** (or equivalent) for transactional email — wired in later phases

## Current status

**Phase 0 — platform foundation** and **Phase 1 — database and tenant security** are in place:

- App layout, Meridian design tokens, and UI primitives
- Route placeholders for public booking, login, dashboard, and admin
- Version-controlled Supabase schema for businesses, profiles, memberships, settings, services, bookings, events, and audit logs
- Row Level Security so business users only access their own tenant data
- Seed data for two test businesses plus migration/RLS tests

Public booking submission and client dashboard auth land in later phases.

## Local setup

### Requirements

- Node.js 20+ (recommended)
- npm 10+

### Install

```bash
npm install
```

### Environment variables

Copy the example file and fill values when later phases require them:

```bash
cp .env.example .env.local
```

See [Environment variables](#environment-variables) below. Do not commit real secrets.

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Lint, test & build

```bash
npm run lint
npm test
npm run build
```

Tenant isolation details: [docs/tenant-isolation.md](docs/tenant-isolation.md).

### Local Supabase (optional)

```bash
npx supabase start
npx supabase db reset
```

Then set `.env.local` from the CLI output (`API URL`, `anon key`, `service_role key`).

## Architecture summary

```text
src/
  app/                 # Next.js routes (book, login, dashboard, admin)
  components/
    ui/                # Shared primitives (button, input, card, …)
    booking/           # Public booking UI (later)
    dashboard/         # Client dashboard UI (later)
    admin/             # Meridian admin UI (later)
  emails/              # Transactional email templates (later)
  lib/                 # Shared utilities and server helpers
  styles/              # Design tokens
  types/               # Shared TypeScript types
supabase/
  migrations/          # Version-controlled schema & RLS (Phase 1+)
  functions/           # Edge functions if needed (later)
tests/                 # Automated tests (Phase 1+)
docs/                  # Operational and onboarding docs (later)
```

### Planned booking workflow

```text
Public booking form
→ Pending booking
→ Client dashboard
→ Approve / decline / suggest another time
→ Customer confirmation email + .ics invite
→ Confirmed booking calendar
```

### Multi-tenancy (Phase 1)

- Every client-owned row includes `business_id` (except `businesses` itself and user `profiles`)
- Roles: `meridian_admin` (platform), `business_admin`, `business_member` (memberships)
- Row Level Security restricts business users to their own data
- Service-role client: `src/lib/supabase/admin.ts` only (`server-only`) — never expose to the browser

### Out of scope (unless a later phase asks)

Live availability, payments, staff rotas, calendar sync, booking-provider integrations, floor plans, waitlists, and mobile apps.

## Design system

Light, minimal, playful, and premium. Default radius is **20px**. Base palette:

| Token        | Hex       |
|--------------|-----------|
| Deep teal    | `#16697A` |
| Mid blue     | `#489FB5` |
| Soft blue    | `#82C0CC` |
| Accent orange| `#FFA62B` |
| Surface      | white / light blue-grey |

Tokens live in `src/styles/tokens.css` and are exposed to Tailwind via `src/app/globals.css`. Client brand overrides (colours, logo, copy) will be configuration-driven later — do not hard-code one client’s brand into the platform shell.

## Environment variables

Placeholder names only (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key — never expose to the browser |
| `RESEND_API_KEY` | Transactional email provider API key |
| `EMAIL_FROM` | Default from address for platform emails |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL for links in emails |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest (migration + optional live RLS tests) |

## License

Private — Meridian internal use.
