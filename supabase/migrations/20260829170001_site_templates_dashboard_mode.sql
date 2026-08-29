-- Mode-aware client-site templates: retire legacy seeds, add six draft layouts.

alter table public.site_templates
  add column if not exists dashboard_mode public.dashboard_mode;

comment on column public.site_templates.dashboard_mode is
  'Dashboard mode this template supports. Must match business.dashboard_mode when assigned.';

update public.site_templates
set status = 'retired'
where slug in ('meridian-classic', 'meridian-minimal');

insert into public.site_templates (
  name,
  slug,
  status,
  dashboard_mode,
  allowed_sections,
  description
)
values
  (
    'Hospitality Classic',
    'hospitality-classic',
    'draft',
    'hospitality',
    '["hero", "menu", "gallery", "booking_widget", "contact"]'::jsonb,
    'Full hospitality site with hero, menu, gallery, and booking.'
  ),
  (
    'Hospitality Minimal',
    'hospitality-minimal',
    'draft',
    'hospitality',
    '["hero", "booking_widget"]'::jsonb,
    'Booking-first hospitality landing page.'
  ),
  (
    'Hospitality Editorial',
    'hospitality-editorial',
    'draft',
    'hospitality',
    '["hero", "menu", "contact", "gallery", "booking_widget"]'::jsonb,
    'Story-led hospitality layout foregrounding menu and contact.'
  ),
  (
    'Appointments Classic',
    'appointments-classic',
    'draft',
    'appointments',
    '["hero", "services", "booking_widget", "contact"]'::jsonb,
    'Standard appointments site with services and booking.'
  ),
  (
    'Appointments Minimal',
    'appointments-minimal',
    'draft',
    'appointments',
    '["hero", "booking_widget"]'::jsonb,
    'Fast appointments booking landing page.'
  ),
  (
    'Appointments Studio',
    'appointments-studio',
    'draft',
    'appointments',
    '["hero", "services", "staff", "booking_widget"]'::jsonb,
    'Staff-forward studio layout with services and booking.'
  )
on conflict (slug) do update set
  name = excluded.name,
  dashboard_mode = excluded.dashboard_mode,
  allowed_sections = excluded.allowed_sections,
  description = excluded.description;

create index if not exists site_templates_dashboard_mode_status_idx
  on public.site_templates (dashboard_mode, status);
