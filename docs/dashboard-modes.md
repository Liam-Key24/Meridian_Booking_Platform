# Dashboard modes

Meridian uses **one platform** with two server-resolved dashboard modes:

| Mode | Business types |
|------|----------------|
| `hospitality` | `restaurant`, `cafe`, `pub`, `other` |
| `appointments` | `barber`, `hairdresser`, `beauty_salon`, `tattoo_studio`, `nail_salon`, `tanning_studio` |

## Rules

- Existing businesses default to `dashboard_mode = hospitality`.
- New businesses require an explicit `business_type` at admin create time.
- Effective mode is stored on `businesses.dashboard_mode` and resolved only on the server.
- Browser query strings / client posts **cannot** override mode (`?mode=`, `dashboardMode`, etc. are ignored).
- Only Meridian admins may change `business_type` or `dashboard_mode` (DB trigger + admin actions).
- Capability changes store `updated_by` / `updated_at` and write audit log rows.
- Active business is stored in an **httpOnly** cookie (`meridian_active_business_id`) after membership verification. Switching businesses revalidates `/dashboard` and redirects home so the correct mode/nav loads.

## Shared route

```text
/dashboard
  ├── hospitality dashboard (mode from business row)
  └── appointments dashboard (mode from business row)
```

## Mapping helper

```ts
getDashboardModeForBusinessType(businessType)
```

## Capability defaults

Hospitality: booking requests, calendar, tables, party size, allergies, opening hours, kitchen hours, bar hours, analytics.

Appointments: booking requests, calendar, services, staff, availability, external booking link, email notifications, analytics.

Nav items and routes are filtered/gated by these capabilities server-side.

## Migrations

- `supabase/migrations/20260824073118_business_dashboard_modes.sql`
- `supabase/migrations/20260824073756_appointments_dashboard_support.sql`
