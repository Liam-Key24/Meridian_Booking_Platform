# Cloudflare production setup (manual)

Cloudflare is an **edge** layer for DNS, TLS, WAF, bot management, and Turnstile.
It does **not** replace application authorization (Supabase RLS), Upstash rate
limits, or server-side Turnstile verification.

Do **not** put Supabase service-role keys, Resend keys, or other application
secrets in Cloudflare client/worker configuration. Do **not** create a Worker
that duplicates booking writes unless there is a concrete requirement.

## Prerequisites

- Application hostnames for this environment (e.g. `book.example.com`)
- Separate Turnstile **site** and **secret** keys for development vs production
- `TRUSTED_PROXY=cloudflare` set in the application environment so client IP
  comes from `CF-Connecting-IP` only

## DNS and TLS

1. Add the production hostname in Cloudflare DNS.
2. Enable the orange-cloud **proxy** (not DNS-only) so WAF/bot rules apply.
3. TLS/SSL mode: **Full (strict)** once the origin has a valid certificate
   (Vercel/hosting managed cert is typical).
4. Prefer HTTPS-only / Always Use HTTPS.

## Managed WAF and bot protection

1. Enable Cloudflare Managed WAF ruleset for the zone.
2. Enable Bot Fight Mode or Super Bot Fight Mode at a level appropriate for
   public booking forms (start conservative; watch false positives).
3. Keep Turnstile on the anonymous booking form as an application control —
   WAF bot scores are complementary, not a substitute for siteverify.

## Rate-limit rules (edge)

Add Cloudflare rate-limit rules for anonymous booking endpoints, for example:

- Path contains `/book/` (or the exact public booking route)
- Method `POST`
- Threshold for unusually high POST volume from a single client IP
  (e.g. tens of requests per minute — tune after observing baseline traffic)

These edge rules are a **separate layer** from application Upstash limits.
Do not treat them as interchangeable.

## Environment-specific hostnames

| Environment | Hostname | Turnstile keys | Notes |
|-------------|----------|----------------|-------|
| Local | `localhost` | Dev keys or bypass | Never production secrets |
| Staging | staging hostname | Dev/staging keys | Proxied DNS optional |
| Production | production hostname | Production keys only | Proxied + WAF + rate rules |

## Application wiring checklist

- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = production site key
- [ ] `TURNSTILE_SECRET_KEY` = matching production secret (server-only)
- [ ] `BOOKING_TURNSTILE_BYPASS` **unset** in production
- [ ] `TRUSTED_PROXY=cloudflare`
- [ ] Upstash + `BOOKING_RATE_LIMIT_SECRET` configured (fail closed without them)
- [ ] No service-role / Resend secrets in Cloudflare dashboard “client” settings

## Turnstile notes

- Tokens are single-use; expired/duplicate tokens must reset the widget.
- Server verification: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Return generic errors to customers; never expose Cloudflare error codes in UI.
