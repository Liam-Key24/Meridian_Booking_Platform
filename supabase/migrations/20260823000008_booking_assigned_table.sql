-- Optional restaurant table assignment on bookings

alter table public.bookings
  add column if not exists assigned_table text;

comment on column public.bookings.assigned_table is
  'Optional table label/number assigned by staff for restaurant-style bookings.';
