# Security review checklist

Confirm before merging platform work:

- [x] No secrets committed (`.env*` ignored except `.env.example`)
- [x] Relevant tables have RLS enabled (`businesses`, `profiles`, `business_memberships`, `booking_settings`, `services`, `bookings`, `booking_events`, `audit_logs`, `email_delivery_logs`, `site_templates`, `business_template_assignments`)
- [x] Users cannot access another business’s data without membership (tenant isolation tests + admin-only cross-tenant policies)
- [x] Public forms are rate-limited (Upstash/durable), Turnstile-verified, validated, and idempotent (`src/lib/booking/`)
- [x] External booking URLs reject unsafe protocols (`src/lib/booking/external-url.ts`)
- [x] Privileged actions run server-side (`"use server"` admin/dashboard/template actions; CSV export checks `meridian_admin`)
- [x] Template preview/publish gated on assigned active template
- [x] Application builds successfully (`npm run build`)

Additional notes:

- Meridian admin access is `profiles.platform_role = meridian_admin`, not a fake membership on every business.
- Public booking inserts use the service-role client; anon has no direct table writes.
- Email delivery attempts are logged for support visibility without exposing Resend keys to the browser.
- Rate-limit keys hash identifiers; raw IPs/emails are not logged for limiting.
- Turnstile secret and Upstash tokens are server-only.
