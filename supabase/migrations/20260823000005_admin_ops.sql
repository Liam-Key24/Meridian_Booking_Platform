-- Phase 6: Meridian admin RLS expansions + email delivery logs

-- ---------------------------------------------------------------------------
-- businesses: platform admin may update tenant records
-- ---------------------------------------------------------------------------

create policy "businesses_update_meridian_admin"
on public.businesses
for update
to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

-- ---------------------------------------------------------------------------
-- booking_settings / services / bookings / booking_events — admin support access
-- ---------------------------------------------------------------------------

create policy "booking_settings_select_meridian_admin"
on public.booking_settings for select to authenticated
using (public.is_meridian_admin());

create policy "booking_settings_insert_meridian_admin"
on public.booking_settings for insert to authenticated
with check (public.is_meridian_admin());

create policy "booking_settings_update_meridian_admin"
on public.booking_settings for update to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

create policy "services_select_meridian_admin"
on public.services for select to authenticated
using (public.is_meridian_admin());

create policy "services_insert_meridian_admin"
on public.services for insert to authenticated
with check (public.is_meridian_admin());

create policy "services_update_meridian_admin"
on public.services for update to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

create policy "services_delete_meridian_admin"
on public.services for delete to authenticated
using (public.is_meridian_admin());

create policy "bookings_select_meridian_admin"
on public.bookings for select to authenticated
using (public.is_meridian_admin());

create policy "bookings_insert_meridian_admin"
on public.bookings for insert to authenticated
with check (public.is_meridian_admin());

create policy "bookings_update_meridian_admin"
on public.bookings for update to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

create policy "booking_events_select_meridian_admin"
on public.booking_events for select to authenticated
using (public.is_meridian_admin());

create policy "booking_events_insert_meridian_admin"
on public.booking_events for insert to authenticated
with check (public.is_meridian_admin());

-- ---------------------------------------------------------------------------
-- email_delivery_logs — visibility into send success/failure
-- ---------------------------------------------------------------------------

create table public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  email_type text not null,
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index email_delivery_logs_business_id_idx
  on public.email_delivery_logs (business_id);
create index email_delivery_logs_created_at_idx
  on public.email_delivery_logs (created_at desc);
create index email_delivery_logs_status_idx
  on public.email_delivery_logs (status);

alter table public.email_delivery_logs enable row level security;

create policy "email_delivery_logs_select_owner_or_admin"
on public.email_delivery_logs
for select
to authenticated
using (
  public.is_meridian_admin()
  or (
    business_id is not null
    and public.is_business_owner(business_id)
  )
);

-- Inserts normally come from the service role (server email helpers).
-- Authenticated insert kept for future member-triggered notifications.
create policy "email_delivery_logs_insert_member_or_admin"
on public.email_delivery_logs
for insert
to authenticated
with check (
  public.is_meridian_admin()
  or (
    business_id is not null
    and public.has_active_business_membership(business_id)
  )
);

revoke all on table public.email_delivery_logs from anon, authenticated;
grant select, insert on table public.email_delivery_logs to authenticated;

comment on table public.email_delivery_logs is
  'Transactional email attempt log for support visibility (Resend or skip).';
