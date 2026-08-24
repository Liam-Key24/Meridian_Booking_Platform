# Production readiness checklist

Use this before promoting Meridian Platform traffic beyond development.

## Merge order

1. `codex/meridian-platform-security-foundation`
2. `codex/meridian-platform-domain-foundation`
3. `codex/meridian-platform-production-readiness`

Do not merge from stale older feature branches.

## Supabase

- [ ] `npx supabase projects list` shows only work against **Meridian Platform Development**
- [ ] Never link Meridian Marketing
- [ ] `npx supabase db push` after confirming project ref
- [ ] Migration `20260824000012_business_modes_and_capabilities.sql` applied
- [ ] Live tenant-isolation tests against Platform Development or local Supabase

## Secrets and env

- [ ] `.env` values match `.env.example` (no secrets in git)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never `NEXT_PUBLIC_`
- [ ] `BOOKING_RATE_LIMIT_SECRET` (≥16 chars) set in production
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set (fail closed without)
- [ ] `TRUSTED_PROXY=cloudflare` when orange-cloud proxied
- [ ] Separate Turnstile **dev** vs **prod** key pairs
- [ ] `BOOKING_TURNSTILE_BYPASS` unset in production
- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain

## Cloudflare (manual)

Follow [cloudflare.md](./cloudflare.md):

- [ ] DNS proxied
- [ ] TLS Full (strict)
- [ ] Managed WAF + bot protection
- [ ] Edge rate limit on public booking POSTs
- [ ] No Workers duplicating booking writes
- [ ] No app secrets in Cloudflare client config

## Manual verification

- [ ] Public booking with valid Turnstile token
- [ ] Invalid / expired / replayed Turnstile token
- [ ] Duplicate booking submission (idempotency)
- [ ] Redis rate limiting + Redis missing in production (generic retry)
- [ ] Spoofed `X-Forwarded-For` ignored when `TRUSTED_PROXY=cloudflare`
- [ ] Unsafe external booking URLs rejected
- [ ] Email failure visible; already-sent retry refused
- [ ] Client login + admin login + non-admin `/admin` denied
- [ ] Cross-tenant dashboard/admin access denied
- [ ] Hospitality vs appointments dashboard labels
- [ ] Empty / large datasets; mobile dashboard; calendar navigation
- [ ] No secrets in logs or browser storage

## Automated gates

```bash
npm run lint
npm test
npm run build
```
