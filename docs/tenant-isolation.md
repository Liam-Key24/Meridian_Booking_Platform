# Tenant isolation tests

This phase proves that business users cannot access another business’s bookings.

## Automated checks (always run)

```bash
npm test
```

Includes:

1. **Migration contract tests** (`tests/migrations.rls.test.ts`) — asserts schema tables, `business_id` on client-owned tables, RLS enablement, roles, and booking select policies exist in version-controlled SQL.
2. **Live RLS tests** (`tests/tenant-isolation.test.ts`) — when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (and seed data applied), signs in as each seeded business admin and asserts:
   - Aura can read Aura’s booking, not Harbour’s
   - Harbour can read Harbour’s booking, not Aura’s
   - Cross-tenant updates return no rows

Without Supabase env vars, live tests are skipped and the skip marker still runs so CI stays green.

## Local Supabase SQL proof

With Docker and the Supabase CLI:

```bash
npx supabase start
npx supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/tenant_isolation.sql
```

Or use Studio SQL editor with `supabase/tests/tenant_isolation.sql`.

Expected counts:

| Session        | Own booking | Other booking |
|----------------|-------------|---------------|
| Aura admin     | 1           | 0             |
| Harbour admin  | 1           | 0             |

## Seed accounts (local only)

| Email | Role | Password |
|-------|------|----------|
| `admin@meridian.test` | `meridian_admin` | `Password123!` |
| `admin@aura-salon.test` | Aura `business_admin` | `Password123!` |
| `admin@harbour-cafe.test` | Harbour `business_admin` | `Password123!` |

## Service-role key

`SUPABASE_SERVICE_ROLE_KEY` must only be used via `src/lib/supabase/admin.ts` (`import "server-only"`). Never prefix it with `NEXT_PUBLIC_` or import the admin module from Client Components.
