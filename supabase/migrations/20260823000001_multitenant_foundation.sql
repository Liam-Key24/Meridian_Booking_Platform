-- Phase 1: core multi-tenant schema
-- businesses + business_memberships (+ profiles for auth linkage)
-- No booking, payment, or Stripe tables in this migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.business_status as enum (
  'active',
  'inactive',
  'suspended'
);

create type public.membership_role as enum (
  'owner',
  'staff'
);

create type public.membership_status as enum (
  'active',
  'inactive'
);

-- Platform admins are NOT business memberships.
-- Stored on profiles so Meridian staff are not fake members of every tenant.
create type public.platform_role as enum (
  'meridian_admin'
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
  status public.business_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint businesses_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint businesses_slug_unique unique (slug)
);

create index businesses_status_idx on public.businesses (status);

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

-- ---------------------------------------------------------------------------
-- business_memberships
-- ---------------------------------------------------------------------------

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'staff',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_memberships_business_user_unique unique (business_id, user_id)
);

create index business_memberships_user_id_idx
  on public.business_memberships (user_id);

create index business_memberships_business_id_idx
  on public.business_memberships (business_id);

create index business_memberships_active_lookup_idx
  on public.business_memberships (user_id, business_id)
  where status = 'active';

create trigger business_memberships_set_updated_at
before update on public.business_memberships
for each row execute function public.set_updated_at();

comment on table public.businesses is
  'Core Meridian tenant. Provider-specific payment IDs belong in a future payment_accounts table, not here.';

comment on table public.business_memberships is
  'Links auth users to businesses with owner/staff roles. Users may belong to multiple businesses.';

comment on column public.profiles.platform_role is
  'Meridian platform administration only. Not a substitute for business membership.';
