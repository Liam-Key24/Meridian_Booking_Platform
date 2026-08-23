-- Phase 1: Row Level Security for multi-tenant access
-- Security boundary is the database, not the UI.

-- ---------------------------------------------------------------------------
-- Helpers (security definer, locked search_path)
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

-- Active membership in a specific business (owner or staff).
create or replace function public.has_active_business_membership(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships
    where business_id = p_business_id
      and user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
  );
$$;

revoke all on function public.is_meridian_admin() from public;
revoke all on function public.has_active_business_membership(uuid) from public;
revoke all on function public.is_business_owner(uuid) from public;

grant execute on function public.is_meridian_admin() to authenticated;
grant execute on function public.has_active_business_membership(uuid) to authenticated;
grant execute on function public.is_business_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.business_memberships enable row level security;

-- ---------------------------------------------------------------------------
-- businesses
-- Meridian admin may read all tenants for future support tooling.
-- Broad write bypass is intentionally NOT granted here.
-- ---------------------------------------------------------------------------

create policy "businesses_select_member_or_admin"
on public.businesses
for select
to authenticated
using (
  public.has_active_business_membership(id)
  or public.is_meridian_admin()
);

create policy "businesses_insert_meridian_admin"
on public.businesses
for insert
to authenticated
with check (public.is_meridian_admin());

create policy "businesses_update_owner"
on public.businesses
for update
to authenticated
using (public.is_business_owner(id))
with check (public.is_business_owner(id));

-- Deletes reserved for controlled platform operations (service role / later admin phase).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_self_colleague_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_meridian_admin()
  or exists (
    select 1
    from public.business_memberships as viewer
    join public.business_memberships as subject
      on subject.business_id = viewer.business_id
     and subject.status = 'active'
    where viewer.user_id = auth.uid()
      and viewer.status = 'active'
      and subject.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_update_meridian_admin"
on public.profiles
for update
to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

-- ---------------------------------------------------------------------------
-- business_memberships
-- ---------------------------------------------------------------------------

create policy "memberships_select_member_or_admin"
on public.business_memberships
for select
to authenticated
using (
  public.has_active_business_membership(business_id)
  or public.is_meridian_admin()
  or user_id = auth.uid()
);

create policy "memberships_insert_owner_or_admin"
on public.business_memberships
for insert
to authenticated
with check (
  public.is_business_owner(business_id)
  or public.is_meridian_admin()
);

create policy "memberships_update_owner_or_admin"
on public.business_memberships
for update
to authenticated
using (
  public.is_business_owner(business_id)
  or public.is_meridian_admin()
)
with check (
  public.is_business_owner(business_id)
  or public.is_meridian_admin()
);

create policy "memberships_delete_owner_or_admin"
on public.business_memberships
for delete
to authenticated
using (
  public.is_business_owner(business_id)
  or public.is_meridian_admin()
);

-- ---------------------------------------------------------------------------
-- Privileges: anon has no table access; authenticated goes through RLS
-- ---------------------------------------------------------------------------

revoke all on table public.businesses from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.business_memberships from anon, authenticated;

grant select, insert, update on table public.businesses to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.business_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- Prevent non-admins escalating platform_role
-- ---------------------------------------------------------------------------

create or replace function public.enforce_platform_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.platform_role is distinct from old.platform_role then
    if not public.is_meridian_admin() then
      raise exception 'Only Meridian admins can change platform_role';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_platform_role
before update on public.profiles
for each row execute function public.enforce_platform_role_change();
