-- Prove Business A and Business B cannot read each other's rows.
-- Run after migrations + seed (local supabase db reset or Platform Development).

begin;
select set_config('request.jwt.claim.sub', '0a111111-1111-4111-8111-11111111110a', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select
  (select count(*) from public.businesses where id = 'a1111111-1111-4111-8111-111111111111') as a_sees_own,
  (select count(*) from public.businesses where id = 'b2222222-2222-4222-8222-222222222222') as a_sees_other;
rollback;

begin;
select set_config('request.jwt.claim.sub', '0b222222-2222-4222-8222-22222222220b', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select
  (select count(*) from public.businesses where id = 'b2222222-2222-4222-8222-222222222222') as b_sees_own,
  (select count(*) from public.businesses where id = 'a1111111-1111-4111-8111-111111111111') as b_sees_other;
rollback;

-- Unauthenticated (anon) should have no table privileges / empty results under RLS.
begin;
set local role anon;
select count(*) as anon_business_count from public.businesses;
rollback;
