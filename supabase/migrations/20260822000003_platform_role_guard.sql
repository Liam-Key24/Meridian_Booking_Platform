-- Prevent non-admins from escalating platform_role on profiles.

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
