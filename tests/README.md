# Tests

## Commands

```bash
npm test
```

## Coverage in Phase 1

| File | What it proves |
|------|----------------|
| `migrations.rls.test.ts` | Core tables, `business_id`, RLS enablement, roles, and booking policies exist in migrations |
| `tenant-isolation.test.ts` | Live proof (when Supabase env is set) that two businesses cannot read/update each other’s bookings |

See also:

- `docs/tenant-isolation.md`
- `supabase/tests/tenant_isolation.sql`
