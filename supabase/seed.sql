-- Seed two isolated businesses for RLS verification.
-- Local/dev passwords only: Password123!
-- Keep IDs in sync with src/lib/supabase/seed-ids.ts
--
-- Note: assign meridian_admin after auth insert, with the platform-role
-- trigger temporarily disabled (auth.uid() is null during seed).

create extension if not exists "pgcrypto";

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
    '01111111-1111-4111-8111-111111111101',
    'authenticated',
    'authenticated',
    'admin@meridian.test',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Meridian Admin"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '0a111111-1111-4111-8111-11111111110a',
    'authenticated',
    'authenticated',
    'owner@business-a.test',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Business A Owner"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '0b222222-2222-4222-8222-22222222220b',
    'authenticated',
    'authenticated',
    'owner@business-b.test',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Business B Owner"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
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
    '01111111-1111-4111-8111-111111111101',
    '01111111-1111-4111-8111-111111111101',
    '{"sub":"01111111-1111-4111-8111-111111111101","email":"admin@meridian.test"}'::jsonb,
    'email',
    '01111111-1111-4111-8111-111111111101',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '0a111111-1111-4111-8111-11111111110a',
    '0a111111-1111-4111-8111-11111111110a',
    '{"sub":"0a111111-1111-4111-8111-11111111110a","email":"owner@business-a.test"}'::jsonb,
    'email',
    '0a111111-1111-4111-8111-11111111110a',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '0b222222-2222-4222-8222-22222222220b',
    '0b222222-2222-4222-8222-22222222220b',
    '{"sub":"0b222222-2222-4222-8222-22222222220b","email":"owner@business-b.test"}'::jsonb,
    'email',
    '0b222222-2222-4222-8222-22222222220b',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

alter table public.profiles disable trigger profiles_enforce_platform_role;

update public.profiles
set
  platform_role = 'meridian_admin',
  full_name = 'Meridian Admin'
where id = '01111111-1111-4111-8111-111111111101';

alter table public.profiles enable trigger profiles_enforce_platform_role;

insert into public.businesses (id, name, slug, status)
values
  ('a1111111-1111-4111-8111-111111111111', 'Business A', 'business-a', 'active'),
  ('b2222222-2222-4222-8222-222222222222', 'Business B', 'business-b', 'active')
on conflict (id) do nothing;

insert into public.business_memberships (business_id, user_id, role, status)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    '0a111111-1111-4111-8111-11111111110a',
    'owner',
    'active'
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    '0b222222-2222-4222-8222-22222222220b',
    'owner',
    'active'
  )
on conflict (business_id, user_id) do nothing;

insert into public.booking_settings (
  business_id,
  notification_email,
  timezone,
  booking_mode
)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'bookings@business-a.test',
    'Europe/London',
    'meridian'
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'bookings@business-b.test',
    'Europe/London',
    'meridian'
  )
on conflict (business_id) do nothing;

insert into public.services (
  id,
  business_id,
  name,
  description,
  duration_minutes,
  is_active
)
values
  (
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'Consultation',
    'Introductory appointment',
    60,
    true
  ),
  (
    'c2222222-2222-4222-8222-222222222222',
    'b2222222-2222-4222-8222-222222222222',
    'Table for two',
    'Evening dining request',
    90,
    true
  )
on conflict (id) do nothing;

