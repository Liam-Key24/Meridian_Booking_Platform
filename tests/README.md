# Tests

```bash
npm test
```

| File | Proves |
|------|--------|
| `migrations.rls.test.ts` | Phase 1 schema, roles, RLS, no Stripe tables |
| `tenant-isolation.test.ts` | Live cross-tenant denial when env is configured |

See `docs/tenant-isolation.md`.
