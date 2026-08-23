# Operations runbook

## Backups and restore testing

- Supabase Platform Development and any future production project should have automated daily backups enabled on the paid plan (or PITR where available).
- Quarterly restore drill:
  1. Create a temporary branch / restore into a scratch project.
  2. Verify `businesses`, `bookings`, `business_memberships`, and `audit_logs` row counts.
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

Retention jobs are not automated in this phase — schedule manually or via future cron.

## Client data export and account closure

### Export

1. Sign in as `meridian_admin`.
2. Open `/admin/businesses/[id]` → **Export CSV**, or `/admin/bookings/export?businessId=…`.
3. Deliver the CSV to the client over an agreed secure channel.

### Closure

1. Set business status to `inactive` or `suspended`.
2. Mark all memberships `inactive`.
3. Export bookings + note audit trail.
4. After the contractual retention window, delete or anonymise bookings and memberships (service role / controlled SQL — never from the browser).
5. Record the closure in `audit_logs`.

## Incident handling

1. Contain — revoke compromised user sessions in Supabase Auth; rotate publishable/service keys if leaked.
2. Assess — check `/admin/audit-logs` and `/admin/email-logs`; confirm whether cross-tenant access occurred.
3. Notify — follow client contract and applicable privacy law.
4. Remediate — patch RLS/app code; add regression tests under `tests/`.
5. Review — update this runbook with lessons learned.

## Onboarding a new business

1. Create the business in `/admin/businesses/new` (slug, notification email, timezone).
2. Ask the client owner to sign up (email/password).
3. Add their membership as `owner` on the business detail page.
4. Configure booking mode + services (admin or client dashboard settings).
5. Share `/book/[slug]` and confirm a test pending request.
6. Optionally seed a confirmed booking from the calendar.

## Required production environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Platform, not Marketing) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; public booking inserts + email logging |
| `SITE_URL` | Absolute site origin for redirects/links |
| `RESEND_API_KEY` | Transactional email (optional locally; required in prod) |
| `EMAIL_FROM` | Verified Resend from-address |

Never commit `.env.local` or service-role keys.
