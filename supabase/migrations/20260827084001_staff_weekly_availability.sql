-- Appointments staff: weekly availability on business_staff + booking assignment FK.

alter table public.business_staff
  add column if not exists weekly_availability jsonb not null default '{}'::jsonb;

comment on column public.business_staff.weekly_availability is
  'Per-weekday open/close/closed hours for bookable staff. Empty object inherits business opening hours until edited.';

comment on column public.business_staff.active is
  'When false, staff are hidden from the public booking preferred-staff list.';

alter table public.bookings
  add column if not exists assigned_staff_id uuid
    references public.business_staff (id) on delete set null;

create index if not exists bookings_assigned_staff_id_idx
  on public.bookings (assigned_staff_id);

comment on column public.bookings.assigned_staff_id is
  'Optional business_staff row preferred/assigned for appointment-style bookings.';
