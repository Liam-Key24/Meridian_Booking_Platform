-- Business types, dashboard modes, and capability allowlists.
-- Existing tenants keep hospitality mode so the current dashboard does not change.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.business_type as enum (
  'barber',
  'hairdresser',
  'beauty_salon',
  'tattoo_studio',
  'nail_salon',
  'tanning_studio',
  'restaurant',
  'cafe',
  'pub',
  'other'
);

create type public.dashboard_mode as enum (
  'appointments',
  'hospitality'
);

create type public.capability_key as enum (
  'booking_requests',
  'calendar',
  'services',
  'staff',
  'availability',
  'tables',
  'party_size',
  'allergies',
  'opening_hours',
  'kitchen_hours',
  'bar_hours',
  'external_booking_link',
  'email_notifications',
  'analytics'
);

-- ---------------------------------------------------------------------------
-- businesses: type + effective mode (mode is server-authoritative)
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists business_type public.business_type,
  add column if not exists dashboard_mode public.dashboard_mode not null default 'hospitality';

comment on column public.businesses.business_type is
  'Explicit vertical for onboarding. Nullable only for legacy rows; new businesses require a type.';
comment on column public.businesses.dashboard_mode is
  'Effective dashboard experience. Resolved server-side; never trust the browser.';

-- Existing rows keep hospitality (column default + backfill).
update public.businesses
set dashboard_mode = 'hospitality'
where dashboard_mode is distinct from 'hospitality';

create index if not exists businesses_dashboard_mode_idx
  on public.businesses (dashboard_mode);

create index if not exists businesses_business_type_idx
  on public.businesses (business_type);

-- Only Meridian admins may change business_type or dashboard_mode.
create or replace function public.prevent_non_admin_dashboard_mode_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and (
       old.business_type is distinct from new.business_type
       or old.dashboard_mode is distinct from new.dashboard_mode
     )
     and not public.is_meridian_admin()
  then
    raise exception 'Only Meridian admins may change business type or dashboard mode';
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_protect_dashboard_mode on public.businesses;
create trigger businesses_protect_dashboard_mode
before update on public.businesses
for each row execute function public.prevent_non_admin_dashboard_mode_change();

revoke all on function public.prevent_non_admin_dashboard_mode_change() from public;

-- ---------------------------------------------------------------------------
-- business_capabilities (allowlist rows with audit columns)
-- ---------------------------------------------------------------------------

create table public.business_capabilities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  capability_key public.capability_key not null,
  enabled boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint business_capabilities_unique unique (business_id, capability_key)
);

create index business_capabilities_business_id_idx
  on public.business_capabilities (business_id);

create trigger business_capabilities_set_updated_at
before update on public.business_capabilities
for each row execute function public.set_updated_at();

comment on table public.business_capabilities is
  'Per-tenant capability allowlist. Defaults seeded by dashboard mode; changes audited in app.';

alter table public.business_capabilities enable row level security;

create policy "business_capabilities_select_member_or_admin"
on public.business_capabilities
for select
to authenticated
using (
  public.has_active_business_membership(business_id)
  or public.is_meridian_admin()
);

create policy "business_capabilities_insert_meridian_admin"
on public.business_capabilities
for insert
to authenticated
with check (public.is_meridian_admin());

create policy "business_capabilities_update_meridian_admin"
on public.business_capabilities
for update
to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

create policy "business_capabilities_delete_meridian_admin"
on public.business_capabilities
for delete
to authenticated
using (public.is_meridian_admin());

revoke all on table public.business_capabilities from anon, authenticated;
grant select on table public.business_capabilities to authenticated;
grant insert, update, delete on table public.business_capabilities to authenticated;

-- ---------------------------------------------------------------------------
-- Seed default capabilities for every existing hospitality business
-- ---------------------------------------------------------------------------

insert into public.business_capabilities (business_id, capability_key, enabled)
select b.id, cap.key, true
from public.businesses b
cross join (
  values
    ('booking_requests'::public.capability_key),
    ('calendar'::public.capability_key),
    ('tables'::public.capability_key),
    ('party_size'::public.capability_key),
    ('allergies'::public.capability_key),
    ('opening_hours'::public.capability_key),
    ('kitchen_hours'::public.capability_key),
    ('bar_hours'::public.capability_key),
    ('analytics'::public.capability_key)
) as cap(key)
on conflict (business_id, capability_key) do nothing;
