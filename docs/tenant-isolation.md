# Tenant isolation verification

Phase 1 proves database-level isolation between Business A and Business B.

## Seed accounts (local / Development only)

| Email | Access |
|-------|--------|
| `owner@business-a.test` | Owner of Business A |
| `owner@business-b.test` | Owner of Business B |
| `admin@meridian.test` | `meridian_admin` platform role |

Password for seed users: `Password123!` (local/dev only — never production).

IDs: `src/lib/supabase/seed-ids.ts` and `supabase/seed.sql`.

## Automated tests

```bash
npm test
```

- `tests/migrations.rls.test.ts` — schema/RLS contract (always runs)
- `tests/tenant-isolation.test.ts` — live API isolation when Supabase env is set

Live tests require Meridian Platform Development (or local Supabase) with migrations + seed applied:

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# from Meridian Platform Development only

npx supabase link --project-ref <PLATFORM_DEV_REF>
npx supabase db push
# seed separately if not applied by reset
```

Local Docker:

```bash
npx supabase start
npx supabase db reset
# use keys printed by supabase start in .env.local
npm test
```

## SQL verification

```bash
psql "$DATABASE_URL" -f supabase/tests/tenant_isolation.sql
```

Expected: each owner sees own business count `1` and other business count `0`.

## What is proven

```text
User A → Business A = allowed
User A → Business B = denied
User B → Business B = allowed
User B → Business A = denied
Unauthenticated → denied (no grants / no session)
```

The same `business_id` + membership RLS pattern must protect future bookings and payments.
