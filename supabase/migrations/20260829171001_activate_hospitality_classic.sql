-- Activate hospitality-classic for preview and assignment.

update public.site_templates
set status = 'active'
where slug = 'hospitality-classic';
