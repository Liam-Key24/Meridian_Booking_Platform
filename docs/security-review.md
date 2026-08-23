# Security review checklist (Phase 6)

Confirm before merging operational readiness work:

- [x] No secrets committed (`.env*` ignored except `.env.example`)
- [x] Relevant tables have RLS enabled (`businesses`, `profiles`, `business_memberships`, `booking_settings`, `services`, `bookings`, `booking_events`, `audit_logs`, `email_delivery_logs`)
- [x] Users cannot access another business’s data without membership (tenant isolation tests + admin-only cross-tenant policies)
- [x] Public forms are rate-limited and validated (`src/lib/booking/actions.ts`, `validation.ts`)
- [x] Privileged actions run server-side (`"use server"` admin/dashboard actions; CSV export checks `meridian_admin`)
- [x] Application builds successfully (`npm run build`)

Additional notes:

- Meridian admin access is `profiles.platform_role = meridian_admin`, not a fake membership on every business.
- Public booking inserts use the service-role client; anon has no direct table writes.
- Email delivery attempts are logged for support visibility without exposing Resend keys to the browser.
