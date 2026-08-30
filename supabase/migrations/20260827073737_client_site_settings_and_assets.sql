-- Per-business site branding / menus for future client templates.
-- Source of truth for colours, logos, images, and hospitality menus.

create table public.client_site_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  primary_color text not null default '#0F766E',
  accent_color text not null default '#0D9488',
  background_color text not null default '#FFFFFF',
  text_color text not null default '#0F172A',
  logo_path text,
  hero_image_path text,
  gallery_paths text[] not null default '{}'::text[],
  menu_json jsonb not null default '{"sections":[]}'::jsonb,
  template_config_version integer not null default 0,
  template_synced_at timestamptz,
  template_sync_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_site_settings_business_unique unique (business_id),
  constraint client_site_settings_primary_color_hex
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint client_site_settings_accent_color_hex
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint client_site_settings_background_color_hex
    check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint client_site_settings_text_color_hex
    check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint client_site_settings_template_config_version_nonneg
    check (template_config_version >= 0)
);

create trigger client_site_settings_set_updated_at
before update on public.client_site_settings
for each row execute function public.set_updated_at();

alter table public.client_site_settings enable row level security;

create policy "client_site_settings_select_member_or_admin"
on public.client_site_settings for select to authenticated
using (
  public.is_meridian_admin()
  or public.has_active_business_membership(business_id)
);

create policy "client_site_settings_write_meridian_admin"
on public.client_site_settings for all to authenticated
using (public.is_meridian_admin())
with check (public.is_meridian_admin());

revoke all on table public.client_site_settings from anon, authenticated;
grant select, insert, update, delete on table public.client_site_settings to authenticated;

insert into public.client_site_settings (business_id)
select id from public.businesses
on conflict (business_id) do nothing;

alter table public.business_template_assignments
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_version integer not null default 0;

alter table public.business_template_assignments
  drop constraint if exists business_template_assignments_sync_version_nonneg;

alter table public.business_template_assignments
  add constraint business_template_assignments_sync_version_nonneg
  check (sync_version >= 0);

comment on table public.client_site_settings is
  'Per-business branding, media, and menus. Future templates read this store; sync bumps template_config_version.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "business_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'business-assets');

create policy "business_assets_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'business-assets'
  and public.is_meridian_admin()
);

create policy "business_assets_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'business-assets'
  and public.is_meridian_admin()
)
with check (
  bucket_id = 'business-assets'
  and public.is_meridian_admin()
);

create policy "business_assets_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'business-assets'
  and public.is_meridian_admin()
);
