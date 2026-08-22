# Database migrations

Version-controlled Postgres migrations for Meridian Platform Development.

Stage 0 has no schema migrations yet. Stage 1 adds multi-tenant tables and RLS.

```bash
npx supabase link --project-ref <MERIDIAN_PLATFORM_DEVELOPMENT_PROJECT_REF>
npx supabase db push
```

Never point this CLI at the Meridian Marketing Supabase project.
