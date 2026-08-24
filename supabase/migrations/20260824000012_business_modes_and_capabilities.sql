-- Business modes, dashboard modes, and capability registry.
-- Additive only. Does not remove existing booking/hospitality data.
-- Future-ready stubs: business_staff, restaurant_tables, business_subscriptions
-- (no scheduling/payments/floor-plan behaviour in this migration).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.business_type as enum (
  'salon',
  'barber',
  'hairdresser',
  'tattoo',
  'nails',
  'tanning',
  'restaurant'
);

create type public.dashboard_mode as enum (
  'appointments',
  'hospitality'
);

create type public.business_capability_key as enum (
  'staff_assignment',
  'table_management',
  'allergy_notes',
  'guest_count',
  'manual_bookings',
  'external_booking',
  'calendar',
  'customer_notes'
);

-- ---------------------------------------------------------------------------
-- businesses: type + mode (identity separate from subscriptions)
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column business_type public.business_type not null default 'restaurant',
  add column dashboard_mode public.dashboard_mode not null default 'hospitality';

create index businesses_business_type_idx on public.businesses (business_type);
create index businesses_dashboard_mode_idx on public.businesses (dashboard_mode);

comment on column public.businesses.business_type is
  'Industry identity. Changing type does not delete historical bookings.';
comment on column public.businesses.dashboard_mode is
  'UI/metrics mode: appointments vs hospitality. Independent of Stripe/subscriptions.';

-- ---------------------------------------------------------------------------
-- business_capabilities (allow-listed feature flags per business)
-- ---------------------------------------------------------------------------

create table public.business_capabilities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  capability public.business_capability_key not null,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_capabilities_unique unique (business_id, capability)
);

create index business_capabilities_business_id_idx
  on public.business_capabilities (business_id);

create index business_capabilities_business_enabled_idx
  on public.business_capabilities (business_id, enabled)
  where enabled = true;

create trigger business_capabilities_set_updated_at
before update on public.business_capabilities
for each row execute function public.set_updated_at();

alter table public.business_capabilities enable row level security;

revoke all on table public.business_capabilities from anon, authenticated;
grant select on table public.business_capabilities to authenticated;
-- Writes are meridian_admin only (owners cannot grant themselves capabilities)
grant insert, update, delete on table public.business_capabilities to authenticated;

create policy business_capabilities_select_member
  on public.business_capabilities
  for select
  to authenticated
  using (
    public.has_active_business_membership(business_id)
    or public.is_meridian_admin()
  );

create policy business_capabilities_insert_admin
  on public.business_capabilities
  for insert
  to authenticated
  with check (public.is_meridian_admin());

create policy business_capabilities_update_admin
  on public.business_capabilities
  for update
  to authenticated
  using (public.is_meridian_admin())
  with check (public.is_meridian_admin());

create policy business_capabilities_delete_admin
  on public.business_capabilities
  for delete
  to authenticated
  using (public.is_meridian_admin());

-- Seed defaults for existing businesses (hospitality / restaurant-shaped)
insert into public.business_capabilities (business_id, capability, enabled)
select b.id, c.capability, true
from public.businesses b
cross join (
  values
    ('table_management'::public.business_capability_key),
    ('allergy_notes'::public.business_capability_key),
    ('guest_count'::public.business_capability_key),
    ('manual_bookings'::public.business_capability_key),
    ('external_booking'::public.business_capability_key),
    ('calendar'::public.business_capability_key),
    ('customer_notes'::public.business_capability_key)
) as c(capability)
on conflict (business_id, capability) do nothing;

-- staff_assignment off by default for existing hospitality tenants
insert into public.business_capabilities (business_id, capability, enabled)
select b.id, 'staff_assignment'::public.business_capability_key, false
from public.businesses b
on conflict (business_id, capability) do nothing;

-- ---------------------------------------------------------------------------
-- Future stubs (schema only — no app workflows yet)
-- ---------------------------------------------------------------------------

create table public.business_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_staff_display_name_len check (
    char_length(display_name) between 1 and 120
  )
);

create index business_staff_business_id_idx on public.business_staff (business_id);

create trigger business_staff_set_updated_at
before update on public.business_staff
for each row execute function public.set_updated_at();

alter table public.business_staff enable row level security;
revoke all on table public.business_staff from anon, authenticated;
grant select, insert, update, delete on table public.business_staff to authenticated;

create policy business_staff_select_member
  on public.business_staff for select to authenticated
  using (
    public.has_active_business_membership(business_id)
    or public.is_meridian_admin()
  );

create policy business_staff_write_owner_or_admin
  on public.business_staff for all to authenticated
  using (
    public.is_business_owner(business_id) or public.is_meridian_admin()
  )
  with check (
    public.is_business_owner(business_id) or public.is_meridian_admin()
  );

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null,
  seats integer not null default 2,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint restaurant_tables_label_len check (char_length(label) between 1 and 64),
  constraint restaurant_tables_seats_range check (seats between 1 and 100),
  constraint restaurant_tables_business_label_unique unique (business_id, label)
);

create index restaurant_tables_business_id_idx on public.restaurant_tables (business_id);

create trigger restaurant_tables_set_updated_at
before update on public.restaurant_tables
for each row execute function public.set_updated_at();

alter table public.restaurant_tables enable row level security;
revoke all on table public.restaurant_tables from anon, authenticated;
grant select, insert, update, delete on table public.restaurant_tables to authenticated;

create policy restaurant_tables_select_member
  on public.restaurant_tables for select to authenticated
  using (
    public.has_active_business_membership(business_id)
    or public.is_meridian_admin()
  );

create policy restaurant_tables_write_owner_or_admin
  on public.restaurant_tables for all to authenticated
  using (
    public.is_business_owner(business_id) or public.is_meridian_admin()
  )
  with check (
    public.is_business_owner(business_id) or public.is_meridian_admin()
  );

-- Subscription lifecycle intentionally separate from business identity.
-- No Stripe IDs on businesses.
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'inactive'
);

create table public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  status public.subscription_status not null default 'inactive',
  plan_code text not null default 'standard',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_subscriptions_one_per_business unique (business_id),
  constraint business_subscriptions_plan_code_len check (
    char_length(plan_code) between 1 and 64
  )
);

create index business_subscriptions_business_id_idx
  on public.business_subscriptions (business_id);
create index business_subscriptions_status_idx
  on public.business_subscriptions (status);

create trigger business_subscriptions_set_updated_at
before update on public.business_subscriptions
for each row execute function public.set_updated_at();

alter table public.business_subscriptions enable row level security;
revoke all on table public.business_subscriptions from anon, authenticated;
grant select on table public.business_subscriptions to authenticated;
grant insert, update, delete on table public.business_subscriptions to authenticated;

create policy business_subscriptions_select_owner_or_admin
  on public.business_subscriptions for select to authenticated
  using (
    public.is_business_owner(business_id) or public.is_meridian_admin()
  );

create policy business_subscriptions_write_admin
  on public.business_subscriptions for all to authenticated
  using (public.is_meridian_admin())
  with check (public.is_meridian_admin());
