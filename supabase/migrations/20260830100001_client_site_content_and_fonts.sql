-- Content assets (favicon) and uploaded brand fonts for client sites.

alter table public.client_site_settings
  add column if not exists favicon_path text,
  add column if not exists heading_font_path text,
  add column if not exists body_font_path text;

comment on column public.client_site_settings.favicon_path is
  'Public business-assets path for the client-site favicon.';
comment on column public.client_site_settings.heading_font_path is
  'Uploaded heading font file in business-assets. Falls back to the template preset.';
comment on column public.client_site_settings.body_font_path is
  'Uploaded body font file in business-assets. Falls back to the template preset.';

update storage.buckets
set
  file_size_limit = 15728640,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'application/pdf',
    'font/woff2',
    'font/woff',
    'font/ttf',
    'font/otf',
    'font/sfnt',
    'application/font-woff',
    'application/font-woff2',
    'application/x-font-ttf',
    'application/x-font-otf'
  ]
where id = 'business-assets';
