-- Appointments dashboard support: no-show status + optional staff assignment.
-- Hospitality flows ignore these fields.

alter type public.booking_status add value if not exists 'no_show';

alter table public.bookings
  add column if not exists assigned_staff_user_id uuid
    references public.profiles (id) on delete set null;

create index if not exists bookings_assigned_staff_user_id_idx
  on public.bookings (assigned_staff_user_id);

comment on column public.bookings.assigned_staff_user_id is
  'Optional staff member (profile) assigned to an appointment-style booking.';
