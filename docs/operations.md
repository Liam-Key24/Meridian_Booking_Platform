# Operations runbook

## Current project phase

Booking requests, client dashboard (actions + analytics + calendar), Meridian admin operations, public-flow hardening (idempotency, Upstash rate limit, Turnstile, URL validation, email log retry), and controlled site-template assignment are implemented. Remaining integrations: Google Calendar, Stripe/payments, SMS, and external booking APIs beyond a validated URL.

## Supabase migrations

1. Link only **Meridian Platform Development** (`npx supabase link --project-ref …`).
2. Apply with `npx supabase db push` (or `db reset` for local Docker).
3. Never edit an already-applied migration file — add a new timestamped migration under `supabase/migrations/`.
4. After schema changes that affect app types, update `src/types/database.ts`.

Key migrations include multitenancy/RLS, bookings, admin/audit/email logs, booking hardening (`idempotency_key`, email `operation_key` / attempt fields), and site templates (`site_templates`, `business_template_assignments`).

## RLS verification

Follow [tenant-isolation.md](./tenant-isolation.md):

1. Seed two businesses and memberships.
2. Sign in as each owner; confirm bookings/settings are tenant-scoped.
3. Confirm anon cannot read/write tenant tables directly.
4. Confirm `meridian_admin` can cross-tenant via admin routes only.
5. Re-check after every migration that touches RLS.

## Production environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Platform project URL (not Marketing) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server publishable key |
| `NEXT_PUBLIC_SITE_URL` | Absolute site origin |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; public inserts + privileged jobs |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Verified Resend from-address |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verify (fail closed in production) |
| `UPSTASH_REDIS_REST_URL` | Durable rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | Durable rate limit |

Never commit `.env.local` or service-role / Resend / Turnstile / Upstash secrets. Never prefix secrets with `NEXT_PUBLIC_`.

### Upstash rate limit

- Limits public booking by hashed IP+business slug and secondary hashed customer email.
- Raw IPs/emails are not stored in Redis keys.
- Local without Upstash: in-memory fallback (single process only). Documented in `.env.example`.

### Cloudflare Turnstile

- Widget on public booking form; secret verified server-side before insert.
- Production: missing secret fails closed.
- Local: omit secret or set `BOOKING_TURNSTILE_BYPASS=true` (never in production).

### Resend

- Used for acknowledgement, business notification, confirmation, decline, suggested time, cancellation.
- Credentials stay server-only. Delivery attempts land in `email_delivery_logs`.

## Email delivery logs and retry

Statuses: `pending`, `sent`, `failed`, `skipped`.

- Deterministic `operation_key` (booking + email type + recipient) prevents duplicate **sent** rows.
- `attempt_count`, `last_attempt_at`, `last_error` support safe visibility.
- Provider message IDs preserved when Resend returns them.
- Meridian admins can retry **failed** messages from `/admin/email-logs` via a server action (no large queue yet).

## Template publishing rules

- Registry: `site_templates` (name, slug, status, allowed_sections).
- One assignment per business: `business_template_assignments`.
- Preview: `/preview/[businessSlug]` only when an **active** template is assigned.
- No public client-site publish without an assigned active template.
- No drag-and-drop editor in this phase. Seeded placeholders: **Meridian Classic**, **Meridian Minimal**.
- Assign templates on `/admin/businesses/[id]`.

## Admin onboarding process

1. Create the business in `/admin/businesses/new` (slug, notification email, timezone).
2. Ask the client owner to sign up (email/password).
3. Add their membership as `owner` on the business detail page.
4. Configure booking mode + services (admin or client dashboard settings).
5. Optionally assign an active site template and open `/preview/[slug]`.
6. Share `/book/[slug]` and confirm a test pending request (Turnstile/Upstash configured in prod).
7. Confirm email logs for acknowledgement + business notification.

## Backups and restore testing

- Supabase Platform Development and any future production project should have automated daily backups enabled on the paid plan (or PITR where available).
- Quarterly restore drill:
  1. Create a temporary branch / restore into a scratch project.
  2. Verify `businesses`, `bookings`, `business_memberships`, `audit_logs`, and `email_delivery_logs` row counts.
  3. Sign in as a seeded owner and confirm tenant isolation still holds.
  4. Document the restore timestamp and outcome in the incident log.

Do not restore production backups into Meridian Marketing (`uibtkxlnhqxmesgfooui`).

## Data retention

| Data | Retention guidance |
|------|--------------------|
| Pending bookings | Keep until decided; purge declined after 24 months unless client requests sooner |
| Confirmed / cancelled bookings | 24 months after preferred date, then anonymise or delete per client agreement |
| Audit logs | 36 months |
| Email delivery logs | 12 months |
| Profiles / memberships | Until account closure |
| Template assignments | Until business closure |

Retention jobs are not automated in this phase — schedule manually or via future cron. Meridian owns backup/retention configuration on the Platform Supabase project; clients do not hold production DB credentials.

## Client data export and account closure

### Export

1. Sign in as `meridian_admin`.
2. Open `/admin/businesses/[id]` → **Export CSV**, or `/admin/bookings/export?businessId=…`.
3. Deliver the CSV to the client over an agreed secure channel.

### Closure

1. Set business status to `inactive` or `suspended`.
2. Mark all memberships `inactive`.
3. Clear or leave template assignment as needed; export bookings + note audit trail.
4. After the contractual retention window, delete or anonymise bookings and memberships (service role / controlled SQL — never from the browser).
5. Record the closure in `audit_logs`.

## Incident handling

1. Contain — revoke compromised user sessions in Supabase Auth; rotate publishable/service keys if leaked.
2. Assess — check `/admin/audit-logs` and `/admin/email-logs`; confirm whether cross-tenant access occurred.
3. Notify — follow client contract and applicable privacy law.
4. Remediate — patch RLS/app code; add regression tests under `tests/`.
5. Review — update this runbook with lessons learned.
