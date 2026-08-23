# Meridian Booking Platform architecture

## Tenant model

```text
User (Supabase Auth)
  ↓
profiles
  ↓
business_memberships  (role: owner | staff, status: active | inactive)
  ↓
businesses
  ↓
Future business-owned records (must include business_id + RLS)
```

A user is **not** tied to a single `business_id` on the auth user. Memberships allow multi-business access later.

## Mandatory rule for future tenant-owned tables

Every future business-owned table must:

1. Contain `business_id`
2. Reference `businesses.id`
3. Have RLS enabled
4. Verify active business membership (or explicit Meridian admin policy)
5. Be tested for cross-tenant isolation before production use

Examples (not built in Phase 1):

```text
services
bookings
booking_events
business_settings
client_site_settings
payment_accounts
payments
refunds
```

## Roles

| Role | Scope | Purpose |
|------|--------|---------|
| `owner` | Business membership | Manages their business |
| `staff` | Business membership | Works inside permitted business functionality |
| `meridian_admin` | `profiles.platform_role` | Platform-level administration |

Meridian admins are **not** fake members of every business. Platform access is separate and auditable. Phase 1 grants Meridian admins selective read/insert policies only — not a silent full bypass.

## Authentication

- Supabase Auth (email/password) only — no custom auth system
- Browser/server clients use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (`src/lib/supabase/admin.ts` + `server-only`)
- Protected routes: `/dashboard`, `/admin` (middleware + server checks)
- Business context: `getAuthSnapshot` / `getBusinessContext` / `requireBusinessMembership`

Never trust a browser-supplied `business_id` without verifying membership server/database-side.

## Environment separation

Use **Meridian Platform Development** only.  
Never use the Meridian Marketing Supabase project.

Future Stripe must use separate test and production configurations (documented below; not implemented yet).

## Future product model

```text
Business
├── Members
├── Services
├── Bookings
├── Payments
└── Payment account
```

## Future payment model (two separate money flows)

### A. Meridian client subscription

```text
Business
  ↓
Stripe Billing
  ↓
Meridian
```

Example: client pays Meridian £99/month for the platform.

### B. Customer booking payment

```text
Customer
  ↓
Booking
  ↓
Stripe (Connect)
  ↓
Client business
```

Example: customer pays £50 for a service; the client business receives the funds. Meridian may take an optional application fee later.

These flows must remain conceptually and data-model separate.

## Future Stripe Connect ownership

Prefer a dedicated table later (do not scatter Stripe IDs on `businesses`):

```text
payment_accounts
  id
  business_id
  provider            -- e.g. 'stripe'
  provider_account_id
  status
  charges_enabled
  payouts_enabled
  created_at
  updated_at
```

```text
businesses
   ↓
payment_accounts
   ↓
Stripe Connected Account
```

## Future booking → payment ownership

```text
Business → Service → Booking → Payment
```

A future payment row should include `business_id` and usually `booking_id`, with RLS so Business A never sees Business B bookings, payments, Connect accounts, or refunds.

## Future payment options (per business, later)

```text
No payment required
Deposit required
Full payment required
```

Illustrative flow (not built):

```text
Choose service → date/time → booking request → business approves
  → payment/deposit if required → Stripe Checkout → verify server-side
  → booking confirmed → confirmation email
```

## Future Stripe security rules

- Never store raw card numbers
- Never collect client bank details directly in Meridian
- Prefer Stripe-hosted payment/onboarding UIs
- Stripe secret keys and webhook secrets stay server-side
- Never trust browser redirect alone as payment success
- Verify payment state server-side
- Verify webhook signatures
- Webhook handling must be idempotent
- Payment records must belong to the correct `business_id`
- Refunds must be auditable
- Platform fees must be explicitly recorded
- Payment and booking status must not drift silently
- Test and production Stripe environments stay separate

**Phase 1 does not install Stripe or implement any of the above.**
