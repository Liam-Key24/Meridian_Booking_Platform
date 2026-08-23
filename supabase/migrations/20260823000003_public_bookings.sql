-- Phase 2: public booking-request tables
-- Tenant-owned: every row includes business_id + RLS

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'declined',
  'cancelled',
  'suggested'
);

create type public.booking_mode as enum (
  'meridian',
  'external',
  'hybrid'
);

-- ---------------------------------------------------------------------------
-- booking_settings (one row per business)
-- ---------------------------------------------------------------------------

create table public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  notification_email text not null,
  timezone text not null default 'Europe/London',
  booking_mode public.booking_mode not null default 'meridian',
  external_booking_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_settings_business_unique unique (business_id),
  constraint booking_settings_external_url_check check (
    booking_mode = 'meridian'
    or external_booking_url is not null
  )
);

create trigger booking_settings_set_updated_at
before update on public.booking_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 60
    check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index services_business_id_idx on public.services (business_id);
create index services_active_idx on public.services (business_id)
  where is_active = true;

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  preferred_date date not null,
  preferred_time time not null,
  guest_count integer check (guest_count is null or guest_count > 0),
  notes text,
  status public.booking_status not null default 'pending',
  suggested_date date,
  suggested_time time,
  privacy_consent_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index bookings_business_id_idx on public.bookings (business_id);
create index bookings_business_status_idx on public.bookings (business_id, status);
create index bookings_preferred_date_idx on public.bookings (business_id, preferred_date);
create index bookings_customer_email_idx on public.bookings (business_id, customer_email);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- booking_events (append-only)
-- ---------------------------------------------------------------------------

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index booking_events_booking_id_idx on public.booking_events (booking_id);
create index booking_events_business_id_idx on public.booking_events (business_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.booking_settings enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;

create policy "booking_settings_select_member"
on public.booking_settings for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "booking_settings_write_owner"
on public.booking_settings for insert to authenticated
with check (public.is_business_owner(business_id));

create policy "booking_settings_update_owner"
on public.booking_settings for update to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "services_select_member"
on public.services for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "services_write_owner"
on public.services for insert to authenticated
with check (public.is_business_owner(business_id));

create policy "services_update_owner"
on public.services for update to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "services_delete_owner"
on public.services for delete to authenticated
using (public.is_business_owner(business_id));

create policy "bookings_select_member"
on public.bookings for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "bookings_insert_member"
on public.bookings for insert to authenticated
with check (public.has_active_business_membership(business_id));

create policy "bookings_update_member"
on public.bookings for update to authenticated
using (public.has_active_business_membership(business_id))
with check (public.has_active_business_membership(business_id));

create policy "booking_events_select_member"
on public.booking_events for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "booking_events_insert_member"
on public.booking_events for insert to authenticated
with check (public.has_active_business_membership(business_id));

revoke all on table public.booking_settings from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.booking_events from anon, authenticated;

grant select, insert, update on table public.booking_settings to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update on table public.bookings to authenticated;
grant select, insert on table public.booking_events to authenticated;

-- Public booking submissions use the server-side service role only.
-- Anon has no direct insert rights.

comment on table public.bookings is
  'Customer booking requests. Public creates go through server actions (service role) as Pending.';
