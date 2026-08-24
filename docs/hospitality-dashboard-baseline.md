# Hospitality dashboard baseline

**Branch:** `codex/meridian-platform-hospitality-baseline`  
**Purpose:** Audit and protect the approved hospitality client dashboard before adding appointments mode.  
**Rule:** Do not redesign, remove, or replace this hospitality experience while building appointments.

The target product model is **one shared platform with two dashboard modes** (`hospitality` | `appointments`). This document freezes what exists today as the hospitality baseline.

---

## Target folder separation (planned)

```text
src/components/dashboard/shared/         # mode-agnostic shell pieces (future extraction)
src/components/dashboard/hospitality/    # hospitality-only UI (future home)
src/components/dashboard/appointments/   # appointments-only UI (Phase 3+)
```

**Phase 1 policy:** Scaffold the folders and document ownership. **Do not move or rewrite** working hospitality components yet unless a shared bug fix is required.

Placeholder READMEs live under those paths. Existing files remain flat under `src/components/dashboard/` until a later extraction PR.

---

## Component inventory

### Hospitality-specific (do not show in appointments mode)

| Path | Why hospitality-specific |
|------|--------------------------|
| `allergy-tags.tsx` | EU allergen codes, kitchen alert UX |
| `business-settings-form.tsx` | Table inventory, max party size, kitchen/bar hours |
| `manual-booking-form.tsx` | Guest/party size, table assignment, allergies |
| `booking-detail-panel.tsx` | Seats, table, allergy editor + kitchen confirm |
| `booking-calendar.tsx` | Table columns, guest counts, ForkKnife / allergy markers |
| `bookings-explorer.tsx` | Seats + table columns, allergy row styling |
| `lib/dashboard/hospitality-settings.ts` | Tables, weekly hours, kitchen close, bar hours parsers |
| `lib/dashboard/settings-actions.ts` | Persists hospitality settings columns |
| `lib/allergies.ts` | Allergen code catalogue used by dashboard + bookings |

Hard-coded hospitality signals also live in:

- `dashboard-shell.tsx` — `ForkKnife` badge, `membershipLabel="Hospitality"` (from layout)
- `app/dashboard/layout.tsx` — forces `membershipLabel="Hospitality"`
- `app/dashboard/page.tsx` — chart `yAxisLabel="Tables"`
- `charts.tsx` — default `yAxisLabel = "Tables"`

### Shared (safe to reuse across modes later)

| Path | Shared role |
|------|-------------|
| `dashboard-shell.tsx` | Layout chrome (nav list will become mode-aware later) |
| `metric-card.tsx` | Metric tiles |
| `charts.tsx` | Chart primitives (labels/titles must become mode-aware) |
| `mini-calendar.tsx` | Date picker |
| `booking-filters.tsx` | Status / date filters |
| `booking-list.tsx` | List plumbing |
| `booking-search-autocomplete.tsx` | Header search |
| `booking-actions-panel.tsx` | Approve / decline / confirm actions |
| `lib/dashboard/require-context.ts` | Auth + membership gate |
| `lib/dashboard/bookings.ts` | Booking list queries |
| `lib/dashboard/booking-actions.ts` | Status / detail mutations |
| `lib/dashboard/booking-search.ts` | Search |
| `lib/dashboard/calendar.ts` | Date helpers + calendar data |
| `lib/dashboard/analytics.ts` | Metrics queries (needs mode-specific series later) |
| `lib/dashboard/analytics-math.ts` | Pure aggregation helpers |

### Appointments (empty in Phase 1)

`src/components/dashboard/appointments/` is reserved. No appointments UI yet.

---

## Sidebar navigation (current hospitality)

Defined in `dashboard-shell.tsx`:

| Item | Href |
|------|------|
| Dashboard | `/dashboard` |
| Bookings | `/dashboard/bookings` |
| Calendar | `/dashboard/calendar` |
| New booking | `/dashboard/bookings/new` |

Footer actions: Settings, Sign out, Help and support.

**Hospitality-only chrome:** business card shows opening hours, ForkKnife + “Hospitality” badge.

**Not present today (appointments-only later):** Customers, Services, Staff, Availability as first-class nav items.

---

## Data queries (hospitality-relevant)

### Shared booking queries (scoped by `business_id`)

- `getDashboardMetrics` — pending / confirmed / cancelled / status distribution / requests-by-period
- Bookings list + detail panels — status, customer, service, preferred date/time
- Calendar loaders — confirmed and pending placements

### Hospitality field usage on bookings

| Field | Used by |
|-------|---------|
| `guest_count` | Party size / seats UI |
| `assigned_table` | Table assignment |
| `allergies` | Allergy tags / kitchen alerts |

### Hospitality settings queries (`booking_settings`)

| Columns | Used by |
|---------|---------|
| `tables_2_seat`, `tables_4_seat`, `tables_6_seat`, `custom_tables` | Table inventory |
| `max_party_size` | Party size limit |
| `opening_hours` | Venue hours + sidebar “Today …” label |
| `kitchen_close_times`, `kitchen_close_enabled` | Kitchen close |
| `bar_opening_hours`, `bar_hours_enabled` | Optional bar hours |
| `holidays` | Closed / special days |
| `booking_slot_minutes`, `max_bookings_per_day` | Booking limits |
| `notification_email`, `contact_phone`, `timezone`, `booking_mode`, `external_booking_url` | Shared ops (also useful for appointments) |

---

## Charts and analytics labels

| Chart / metric | Current behaviour | Hospitality note |
|----------------|-------------------|------------------|
| Pending / Confirmed today / Upcoming / Cancelled | Real counts from `bookings` | Keep for hospitality |
| Status distribution | Real counts | Shared shape |
| Requests by day/period | Real created-at buckets | **Y-axis labelled “Tables”** even when series is booking requests — fix in analytics phase without inventing data |
| Top services | Aggregated from bookings | Shared concept; appointments will emphasise service demand |

There is **no separate covers-by-day or table-utilisation series yet**. Party size / covers appear in list and calendar UI via `guest_count`, not as dedicated home charts. Future hospitality analytics work should add real queries for covers, utilisation, and allergy-marked aggregates — never fake values.

---

## Settings (hospitality-only vs shared)

**Hospitality-only settings surfaces**

- Table inventory (2/4/6 seat + custom)
- Max party size
- Kitchen close toggle + times
- Bar hours toggle + weekly hours

**Shared / reusable settings**

- Business name, email, phone
- Timezone
- Booking mode + external booking URL
- Opening hours (appointments may reframe as availability later)
- Max bookings per day / slot interval
- Holidays

---

## Database tables and migrations (hospitality support)

| Migration | Hospitality relevance |
|-----------|------------------------|
| `20260823000001_multitenant_foundation.sql` | `businesses`, memberships, core bookings/services |
| `20260823000002_multitenant_rls.sql` | Tenant RLS |
| `20260823000003_public_bookings.sql` | Public request path |
| `20260823000004_audit_logs.sql` | Audit trail (needed for later mode/capability changes) |
| `20260823000005_admin_ops.sql` | Admin operations |
| `20260823000006_booking_hardening.sql` | Public flow hardening |
| `20260823000007_site_templates.sql` | Templates |
| `20260823000008_booking_assigned_table.sql` | `bookings.assigned_table` |
| `20260823000009_booking_allergies.sql` | `bookings.allergies` + EU code check |
| `20260823000010_hospitality_booking_settings.sql` | Tables, opening/kitchen/bar hours, party size, holidays |
| `20260823000011_hospitality_hours_toggles.sql` | `kitchen_close_enabled`, `bar_hours_enabled` |

**Not present yet (Phase 2+):** `business_type`, `dashboard_mode`, capability allowlists, staff/availability appointment entities.

Existing businesses have **no mode column**; Phase 2 must default them to `hospitality` so this baseline does not change unexpectedly.

---

## Regression protection

`tests/hospitality-dashboard-baseline.test.ts` asserts that hospitality source surfaces still expose:

- reservations / bookings flows
- tables
- party size / guest count
- allergy information
- opening hours
- kitchen / bar settings
- hospitality analytics entry points (metrics + “Tables” chart label)

Run with `npm run test`.

---

## Extraction guidance for later phases

1. Keep hospitality components working in place until appointments UI exists.
2. Extract shared shell/nav only when both modes need the same chrome.
3. Move hospitality-only files into `hospitality/` behind imports — no behaviour change.
4. Resolve mode **server-side** from business context; never from URL query strings.
5. Capability flags gate features; browser cannot freely override mode.
