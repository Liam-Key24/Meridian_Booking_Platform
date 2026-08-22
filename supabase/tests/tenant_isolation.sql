-- Manual / local Supabase SQL proof that tenants cannot read each other's bookings.
-- Run after `supabase db reset` (applies migrations + seed).
--
-- Expected:
--   aura_sees_own     = 1
--   aura_sees_other   = 0
--   harbour_sees_own  = 1
--   harbour_sees_other = 0

begin;

-- Aura admin session
select set_config('request.jwt.claim.sub', '0a111111-1111-4111-8111-11111111110a', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select
  (select count(*) from public.bookings where id = 'd1111111-1111-4111-8111-111111111111') as aura_sees_own,
  (select count(*) from public.bookings where id = 'd2222222-2222-4222-8222-222222222222') as aura_sees_other;

rollback;

begin;

-- Harbour admin session
select set_config('request.jwt.claim.sub', '0b222222-2222-4222-8222-22222222220b', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select
  (select count(*) from public.bookings where id = 'd2222222-2222-4222-8222-222222222222') as harbour_sees_own,
  (select count(*) from public.bookings where id = 'd1111111-1111-4111-8111-111111111111') as harbour_sees_other;

rollback;
