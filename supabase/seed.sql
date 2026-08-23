-- Seed two isolated businesses for RLS verification.
-- Local/dev passwords only: Password123!
-- Keep IDs in sync with src/lib/supabase/seed-ids.ts

create extension if not exists "pgcrypto";

do $$
declare
  business_a uuid := 'a1111111-1111-4111-8111-111111111111';
  business_b uuid := 'b2222222-2222-4222-8222-222222222222';
  user_a uuid := '0a111111-1111-4111-8111-11111111110a';
  user_b uuid := '0b222222-2222-4222-8222-22222222220b';
  user_meridian uuid := '01111111-1111-4111-8111-111111111101';
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      user_meridian,
      'authenticated',
      'authenticated',
      'admin@meridian.test',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Meridian Admin"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_a,
      'authenticated',
      'authenticated',
      'owner@business-a.test',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Business A Owner"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_b,
      'authenticated',
      'authenticated',
      'owner@business-b.test',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Business B Owner"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '', '', '', ''
    )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      user_meridian,
      user_meridian,
      format('{"sub":"%s","email":"admin@meridian.test"}', user_meridian)::jsonb,
      'email',
      user_meridian::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      user_a,
      user_a,
      format('{"sub":"%s","email":"owner@business-a.test"}', user_a)::jsonb,
      'email',
      user_a::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      user_b,
      user_b,
      format('{"sub":"%s","email":"owner@business-b.test"}', user_b)::jsonb,
      'email',
      user_b::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (id) do nothing;

  insert into public.profiles (id, email, full_name, platform_role)
  values
    (user_meridian, 'admin@meridian.test', 'Meridian Admin', 'meridian_admin'),
    (user_a, 'owner@business-a.test', 'Business A Owner', null),
    (user_b, 'owner@business-b.test', 'Business B Owner', null)
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      platform_role = excluded.platform_role;

  insert into public.businesses (id, name, slug, status)
  values
    (business_a, 'Business A', 'business-a', 'active'),
    (business_b, 'Business B', 'business-b', 'active')
  on conflict (id) do nothing;

  insert into public.business_memberships (business_id, user_id, role, status)
  values
    (business_a, user_a, 'owner', 'active'),
    (business_b, user_b, 'owner', 'active')
  on conflict (business_id, user_id) do nothing;
end;
$$;
