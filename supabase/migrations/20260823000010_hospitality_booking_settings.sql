-- Hospitality ops settings on booking_settings (one row per business)

alter table public.booking_settings
  add column if not exists contact_phone text,
  add column if not exists tables_2_seat integer not null default 0
    check (tables_2_seat >= 0),
  add column if not exists tables_4_seat integer not null default 0
    check (tables_4_seat >= 0),
  add column if not exists tables_6_seat integer not null default 0
    check (tables_6_seat >= 0),
  add column if not exists custom_tables jsonb not null default '[]'::jsonb,
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists kitchen_close_times jsonb not null default '{}'::jsonb,
  add column if not exists bar_opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists holidays jsonb not null default '[]'::jsonb,
  add column if not exists max_bookings_per_day integer
    check (max_bookings_per_day is null or max_bookings_per_day > 0),
  add column if not exists max_party_size integer
    check (max_party_size is null or max_party_size > 0),
  add column if not exists booking_slot_minutes integer not null default 15
    check (booking_slot_minutes in (15, 30, 60));

comment on column public.booking_settings.contact_phone is
  'Public / ops phone for the venue';
comment on column public.booking_settings.custom_tables is
  'Array of {label, seats} for non-standard tables';
comment on column public.booking_settings.opening_hours is
  'Per-weekday {open, close, closed} for venue opening';
comment on column public.booking_settings.kitchen_close_times is
  'Per-weekday kitchen last orders / close time';
comment on column public.booking_settings.bar_opening_hours is
  'Per-weekday {open, close, closed} for bar service';
comment on column public.booking_settings.holidays is
  'Array of {date, label} closed / special days';
