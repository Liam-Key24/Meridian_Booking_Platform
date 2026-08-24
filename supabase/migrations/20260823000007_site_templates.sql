-- Controlled client-site templates (no drag-and-drop editor)

create type public.template_status as enum ('draft', 'active', 'retired');

create table public.site_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status public.template_status not null default 'draft',
  allowed_sections jsonb not null default '[]'::jsonb,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_templates_slug_unique unique (slug),
  constraint site_templates_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger site_templates_set_updated_at
before update on public.site_templates
for each row execute function public.set_updated_at();

create table public.business_template_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  template_id uuid not null references public.site_templates (id) on delete restrict,
  assigned_at timestamptz not null default timezone('utc', now()),
  assigned_by uuid references public.profiles (id) on delete set null,
  constraint business_template_assignments_business_unique unique (business_id)
);

create index business_template_assignments_template_id_idx
  on public.business_template_assignments (template_id);

alter table public.site_templates enable row level security;
alter table public.business_template_assignments enable row level security;

create policy "site_templates_select_authenticated"
on public.site_templates for select to authenticated
using (
  public.is_meridian_admin()
  or status = 'active'
);

create policy "site_templates_write_meridian_admin"
on public.site_templates for all to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

create policy "business_template_assignments_select_member_or_admin"
on public.business_template_assignments for select to authenticated
using (
  public.is_meridian_admin()
  or public.has_active_business_membership(business_id)
);

create policy "business_template_assignments_write_meridian_admin"
on public.business_template_assignments for all to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

revoke all on table public.site_templates from anon, authenticated;
revoke all on table public.business_template_assignments from anon, authenticated;
grant select, insert, update, delete on table public.site_templates to authenticated;
grant select, insert, update, delete on table public.business_template_assignments to authenticated;

insert into public.site_templates (name, slug, status, allowed_sections, description)
values
  (
    'Meridian Classic',
    'meridian-classic',
    'active',
    '["hero", "services", "booking_widget", "contact"]'::jsonb,
    'Default Meridian client template with hero, services, and booking widget.'
  ),
  (
    'Meridian Minimal',
    'meridian-minimal',
    'active',
    '["hero", "booking_widget"]'::jsonb,
    'Minimal Meridian template focused on booking conversion.'
  )
on conflict (slug) do nothing;

comment on table public.site_templates is
  'Controlled Meridian client-site templates. No public publish without an active assignment.';
comment on table public.business_template_assignments is
  'One active template assignment per business. Preview requires an assigned active template.';
