-- Internal subscription metadata for Meridian ops (no payment processing yet).

create type public.subscription_status as enum (
  'trial',
  'active',
  'past_due',
  'cancelled',
  'none'
);

alter table public.businesses
  add column if not exists subscription_status public.subscription_status
    not null default 'none';

comment on column public.businesses.subscription_status is
  'Internal operational subscription metadata. Not a payment integration.';

create index if not exists businesses_subscription_status_idx
  on public.businesses (subscription_status);

-- Only Meridian admins may change subscription_status (extend mode-protection trigger).
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
       or old.subscription_status is distinct from new.subscription_status
     )
     and not public.is_meridian_admin()
  then
    raise exception 'Only Meridian admins may change business type, dashboard mode, or subscription status';
  end if;
  return new;
end;
$$;
