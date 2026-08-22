# Meridian Booking Platform

Secure, multi-tenant booking-request product used by Meridian client sites. The marketing website is separate; this repository is the shared booking platform only.

> **Supabase project:** use **Meridian Platform Development** only.  
> Never connect to, alter, or reuse the Meridian Marketing Supabase project.  
> **Never commit secrets** (`.env.local`, service-role keys, publishable keys with real values, passwords).

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** with Meridian design tokens
- **Supabase** (Auth, Postgres, RLS) — Meridian Platform Development
- Transactional email (e.g. Resend) — later stages

## Current status

**Stage 0 — initialise and link the development environment** is in place:

- App Router layout and Meridian design tokens
- Reusable UI primitives (including error state)
- Route placeholders for `/book/[businessSlug]`, `/login`, `/dashboard`, `/admin`
- Folder structure for app, components, lib, types, emails, Supabase, tests, and docs
- Local Supabase CLI config (`supabase/config.toml`)
- `.env.example` with variable names only

No tables, authentication, booking logic, or email sending in this stage.

## Local setup

### Requirements

- Node.js 20+ (recommended)
- npm 10+
- Supabase CLI (`npx supabase`) for linking and migrations
- Access to the **Meridian Platform Development** Supabase project (not Marketing)

### Install

```bash
npm install
```

### Create `.env.local`

```bash
cp .env.example .env.local
```

Fill values from the Meridian Platform Development project settings (API URL, publishable/anon key, service-role key). Keep `NEXT_PUBLIC_SITE_URL` as your local or deployed app origin (e.g. `http://localhost:3000`).

**Do not commit `.env.local`.** It is gitignored. Never put the service-role key in any `NEXT_PUBLIC_*` variable.

### Link to Meridian Platform Development

From the repo root, with the Supabase CLI logged in to the correct organisation:

```bash
npx supabase login
npx supabase link --project-ref <MERIDIAN_PLATFORM_DEVELOPMENT_PROJECT_REF>
```

Confirm the linked project name is **Meridian Platform Development** before running any remote commands. If you see Marketing credentials or a Marketing project ref, stop and re-link.

Optional local stack (Docker required):

```bash
npx supabase start
```

Use local keys from the CLI output only for local Docker; for shared Development, use the cloud project keys in `.env.local`.

### Run migrations

Migrations live in `supabase/migrations/` (none in Stage 0 — schema starts in Stage 1).

```bash
# Against the linked Meridian Platform Development project (after Stage 1+)
npx supabase db push

# Or reset/apply locally
npx supabase db reset
```

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Lint, build, and tests

```bash
npm run lint
npm run build
# npm test   # added when automated tests land in later stages
```

## Architecture summary

```text
src/
  app/                 # Next.js routes (book, login, dashboard, admin)
  components/
    ui/                # Shared primitives
    booking/           # Public booking UI (later)
    dashboard/         # Client dashboard UI (later)
    admin/             # Meridian admin UI (later)
  emails/              # Transactional email templates (later)
  lib/                 # Shared utilities and server helpers
  styles/              # Design tokens
  types/               # Shared TypeScript types
supabase/
  config.toml          # Local Supabase CLI config
  migrations/          # Version-controlled schema & RLS (Stage 1+)
  functions/           # Edge functions if needed (later)
tests/                 # Automated tests (later)
docs/                  # Operational docs (later)
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

### Security (from Stage 1)

- Every tenant-owned row includes `business_id`
- Roles: `meridian_admin`, `business_admin`, `business_member`
- Row Level Security on client-accessible tables
- Service-role key server-side only — never `NEXT_PUBLIC_`

### Out of scope

Google Calendar / Google APIs, payment APIs, external booking-provider integrations, live availability, SMS, staff rotas, floor plans, and calendar sync.

## Design system

Light, minimal, playful, and premium. Default radius is **20px**. Base palette:

| Token         | Hex       |
|---------------|-----------|
| Deep teal     | `#16697A` |
| Mid blue      | `#489FB5` |
| Soft blue     | `#82C0CC` |
| Accent orange | `#FFA62B` |
| Surface       | white / light blue-grey |

Tokens live in `src/styles/tokens.css`. Client brand overrides will be configuration-driven later — do not hard-code one client’s brand into the platform.

## Environment variables

Names only (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Meridian Platform Development API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable/anon key (RLS-scoped) |
| `NEXT_PUBLIC_SITE_URL` | App origin for absolute links |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key — never expose to the browser |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## License

Private — Meridian internal use.
