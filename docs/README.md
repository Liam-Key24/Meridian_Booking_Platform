# Operational documentation

## Contents

- [Operations runbook](./operations.md) — current phase, migrations, production env (Upstash / Turnstile / Resend), email retry, templates, onboarding, backups/retention
- [Security review checklist](./security-review.md) — pre-merge security checks
- [Architecture](./architecture.md) — tenant model and roles
- [Tenant isolation](./tenant-isolation.md) — seed users and live RLS verification

## Completed capabilities (summary)

| Area | Status |
|------|--------|
| Public booking + hardening | Implemented |
| Client dashboard actions | Implemented |
| Dashboard analytics / charts | Real Supabase data only |
| Calendar | Enhanced existing route; sidebar link |
| Meridian admin | Businesses, memberships, settings, CSV, audit/email logs |
| Controlled templates | Registry + assignment + safe preview |
| Google Calendar / Stripe / SMS | Not started |
