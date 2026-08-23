-- Phase 4: audit_logs for booking decisions

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

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_owner_or_admin"
on public.audit_logs
for select
to authenticated
using (
  public.is_meridian_admin()
  or (
    business_id is not null
    and public.is_business_owner(business_id)
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
    and public.has_active_business_membership(business_id)
  )
);

revoke all on table public.audit_logs from anon, authenticated;
grant select, insert on table public.audit_logs to authenticated;

comment on table public.audit_logs is
  'Append-only audit trail for privileged booking and settings actions.';
