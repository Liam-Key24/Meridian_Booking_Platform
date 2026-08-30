-- Written copy for client-site sections (hero, about, gallery, contact).

alter table public.client_site_settings
  add column if not exists section_copy_json jsonb not null default '{}'::jsonb;

comment on column public.client_site_settings.section_copy_json is
  'Headings, body copy, and CTAs for template sections.';
