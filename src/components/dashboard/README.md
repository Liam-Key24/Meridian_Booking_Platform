# Dashboard components

Client dashboard for authenticated business users. All data access goes through
the session Supabase client (RLS).

## Modes

Meridian targets **one platform, two dashboard modes**:

1. **Hospitality** (approved baseline) — restaurants, cafés, pubs
2. **Appointments** (forthcoming) — barbers, salons, studios, beauty

Until mode routing ships, every business sees the hospitality dashboard.

## Folder layout

```text
dashboard/
  shared/          # future shared extractions components
  hospitality/     # future hospitality-only home
  appointments/    # appointments UI (Phase 3+)
  *.tsx            # current hospitality baseline (do not remove)
```

Baseline audit: [`docs/hospitality-dashboard-baseline.md`](../../../docs/hospitality-dashboard-baseline.md).
