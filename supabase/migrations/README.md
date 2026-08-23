# Database migrations

| File | Purpose |
|------|---------|
| `20260823000001_multitenant_foundation.sql` | businesses, profiles, business_memberships |
| `20260823000002_multitenant_rls.sql` | RLS helpers and policies |

Apply to **Meridian Platform Development** only:

```bash
npx supabase link --project-ref <PLATFORM_DEV_REF>
npx supabase db push
```

Never point this CLI at Meridian Marketing.
