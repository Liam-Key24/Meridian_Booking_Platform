-- Hardening: booking idempotency + email delivery log improvements

-- ---------------------------------------------------------------------------
-- bookings.idempotency_key (unique per business)
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists idempotency_key text;

create unique index if not exists bookings_business_idempotency_key_uidx
  on public.bookings (business_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.bookings.idempotency_key is
  'Client-supplied key to prevent duplicate public booking submissions.';

-- ---------------------------------------------------------------------------
-- email_delivery_logs: operation key, attempts, clearer statuses
-- ---------------------------------------------------------------------------

alter table public.email_delivery_logs
  drop constraint if exists email_delivery_logs_status_check;

alter table public.email_delivery_logs
  add column if not exists operation_key text,
  add column if not exists attempt_count integer not null default 1,
  add column if not exists last_attempt_at timestamptz not null default timezone('utc', now()),
  add column if not exists last_error text;

-- Backfill operation keys for existing rows (deterministic when booking_id present)
update public.email_delivery_logs
set operation_key = coalesce(
  operation_key,
  lower(email_type) || ':' || coalesce(booking_id::text, 'none') || ':' || lower(recipient_email)
)
where operation_key is null;

alter table public.email_delivery_logs
  alter column operation_key set not null;

create unique index if not exists email_delivery_logs_operation_key_uidx
  on public.email_delivery_logs (operation_key);

alter table public.email_delivery_logs
  add constraint email_delivery_logs_status_check
  check (status in ('pending', 'sent', 'failed', 'skipped'));

-- Prefer last_error going forward; keep error_message for compatibility
update public.email_delivery_logs
set last_error = coalesce(last_error, error_message)
where last_error is null and error_message is not null;

comment on column public.email_delivery_logs.operation_key is
  'Deterministic key: email_type + booking_id + recipient (prevents duplicate sent rows).';
comment on column public.email_delivery_logs.attempt_count is
  'Number of send attempts for this operation.';
comment on column public.email_delivery_logs.last_attempt_at is
  'Timestamp of the most recent send attempt.';
comment on column public.email_delivery_logs.last_error is
  'Most recent provider or skip error message (safe for support UI).';
