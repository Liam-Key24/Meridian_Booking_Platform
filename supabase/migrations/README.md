# Database migrations

Version-controlled Postgres migrations for the Meridian booking platform.

| File | Purpose |
|------|---------|
| `20260822000001_core_schema.sql` | Tables, enums, timestamps, profile trigger |
| `20260822000002_row_level_security.sql` | RLS helpers and policies |
| `20260822000003_platform_role_guard.sql` | Block non-admin `platform_role` escalation |

Apply locally:

```bash
npx supabase db reset
```

Seed data for two isolated businesses lives in `../seed.sql`.
See `../../docs/tenant-isolation.md` for RLS verification.
