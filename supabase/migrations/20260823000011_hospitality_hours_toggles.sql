-- Optional kitchen / bar hour tracking toggles

alter table public.booking_settings
  add column if not exists kitchen_close_enabled boolean not null default false,
  add column if not exists bar_hours_enabled boolean not null default false;

comment on column public.booking_settings.kitchen_close_enabled is
  'When true, kitchen close times are configured and shown in settings';
comment on column public.booking_settings.bar_hours_enabled is
  'When true, bar opening hours are configured and shown in settings';
