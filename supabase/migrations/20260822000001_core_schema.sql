-- Meridian Booking Platform: core multi-tenant schema
-- Phase 1 — tables, roles, timestamps, and indexes

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.platform_role as enum ('meridian_admin');

create type public.membership_role as enum (
  'business_admin',
  'business_member'
);

create type public.booking_mode as enum (
  'meridian',
  'external',
  'hybrid'
);

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'declined',
  'cancelled',
  'suggested'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint businesses_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint businesses_slug_unique unique (slug)
);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  platform_role public.platform_role,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_unique unique (email)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- memberships (business-scoped roles)
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'business_member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint memberships_business_user_unique unique (business_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_business_id_idx on public.memberships (business_id);

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

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

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- booking_events (append-only history)
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
-- audit_logs
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_business_id_idx on public.audit_logs (business_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
