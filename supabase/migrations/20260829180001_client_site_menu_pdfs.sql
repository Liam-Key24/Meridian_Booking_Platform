-- Hospitality menu PDFs for client-site menu pages.

alter table public.client_site_settings
  add column if not exists menu_pdfs_json jsonb not null default '[]'::jsonb;

comment on column public.client_site_settings.menu_pdfs_json is
  'Published menu PDF documents: [{ id, title, path, visible }]. Paths reference business-assets storage.';

-- Allow PDF uploads in the public business-assets bucket.
update storage.buckets
set
  file_size_limit = 15728640,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ]
where id = 'business-assets';
