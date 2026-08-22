-- Meridian Booking Platform: Row Level Security
-- Business users may only access their own business data.
-- meridian_admin may access all client data for support/operations.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer, locked search_path)
-- ---------------------------------------------------------------------------

create or replace function public.is_meridian_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and platform_role = 'meridian_admin'
  );
$$;

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_meridian_admin()
    or exists (
      select 1
      from public.memberships
      where business_id = p_business_id
        and user_id = auth.uid()
    );
$$;

create or replace function public.is_business_admin(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_meridian_admin()
    or exists (
      select 1
      from public.memberships
      where business_id = p_business_id
        and user_id = auth.uid()
        and role = 'business_admin'
    );
$$;

revoke all on function public.is_meridian_admin() from public;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_admin(uuid) from public;

grant execute on function public.is_meridian_admin() to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every client-accessible table
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.booking_settings enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create policy "businesses_select_member"
on public.businesses
for select
to authenticated
using (public.is_business_member(id));

create policy "businesses_insert_meridian_admin"
on public.businesses
for insert
to authenticated
with check (public.is_meridian_admin());

create policy "businesses_update_admin"
on public.businesses
for update
to authenticated
using (public.is_business_admin(id))
with check (public.is_business_admin(id));

create policy "businesses_delete_meridian_admin"
on public.businesses
for delete
to authenticated
using (public.is_meridian_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_meridian_admin()
  or exists (
    select 1
    from public.memberships as viewer
    join public.memberships as subject
      on subject.business_id = viewer.business_id
    where viewer.user_id = auth.uid()
      and subject.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
-- platform_role changes are blocked for non-admins by enforce_platform_role_change()

create policy "profiles_update_meridian_admin"
on public.profiles
for update
to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

create policy "memberships_select_member"
on public.memberships
for select
to authenticated
using (public.is_business_member(business_id));

create policy "memberships_insert_admin"
on public.memberships
for insert
to authenticated
with check (public.is_business_admin(business_id));

create policy "memberships_update_admin"
on public.memberships
for update
to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

create policy "memberships_delete_admin"
on public.memberships
for delete
to authenticated
using (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- booking_settings
-- ---------------------------------------------------------------------------

create policy "booking_settings_select_member"
on public.booking_settings
for select
to authenticated
using (public.is_business_member(business_id));

create policy "booking_settings_insert_admin"
on public.booking_settings
for insert
to authenticated
with check (public.is_business_admin(business_id));

create policy "booking_settings_update_admin"
on public.booking_settings
for update
to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

create policy "booking_settings_delete_admin"
on public.booking_settings
for delete
to authenticated
using (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create policy "services_select_member"
on public.services
for select
to authenticated
using (public.is_business_member(business_id));

create policy "services_insert_admin"
on public.services
for insert
to authenticated
with check (public.is_business_admin(business_id));

create policy "services_update_admin"
on public.services
for update
to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

create policy "services_delete_admin"
on public.services
for delete
to authenticated
using (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create policy "bookings_select_member"
on public.bookings
for select
to authenticated
using (public.is_business_member(business_id));

create policy "bookings_insert_member"
on public.bookings
for insert
to authenticated
with check (public.is_business_member(business_id));

create policy "bookings_update_member"
on public.bookings
for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "bookings_delete_admin"
on public.bookings
for delete
to authenticated
using (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- booking_events
-- ---------------------------------------------------------------------------

create policy "booking_events_select_member"
on public.booking_events
for select
to authenticated
using (public.is_business_member(business_id));

create policy "booking_events_insert_member"
on public.booking_events
for insert
to authenticated
with check (public.is_business_member(business_id));

-- Events are append-only for business users (no update/delete policies).
-- Meridian admins may delete via service role if required for compliance.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (
  public.is_meridian_admin()
  or (
    business_id is not null
    and public.is_business_admin(business_id)
  )
);

create policy "audit_logs_insert_member"
on public.audit_logs
for insert
to authenticated
with check (
  public.is_meridian_admin()
  or (
    business_id is not null
    and public.is_business_member(business_id)
  )
);

-- Audit logs are append-only for authenticated users.

-- ---------------------------------------------------------------------------
-- Privileges: authenticated may access via RLS; anon has no table access yet
-- (public booking inserts arrive in Phase 2 via controlled server paths).
-- ---------------------------------------------------------------------------

revoke all on table public.businesses from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.memberships from anon, authenticated;
revoke all on table public.booking_settings from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.booking_events from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select, insert, update, delete on table public.businesses to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;
grant select, insert, update, delete on table public.booking_settings to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;
grant select, insert on table public.booking_events to authenticated;
grant select, insert on table public.audit_logs to authenticated;
