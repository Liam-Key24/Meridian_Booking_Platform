-- Seed / test data for two isolated businesses.
-- Passwords for local testing only: Password123!
-- Keep IDs in sync with src/lib/supabase/constants.ts

create extension if not exists "pgcrypto";

do $$
declare
  business_aura uuid := 'a1111111-1111-4111-8111-111111111111';
  business_harbour uuid := 'b2222222-2222-4222-8222-222222222222';
  user_meridian uuid := '01111111-1111-4111-8111-111111111101';
  user_aura uuid := '0a111111-1111-4111-8111-11111111110a';
  user_harbour uuid := '0b222222-2222-4222-8222-22222222220b';
  service_aura uuid := 'c1111111-1111-4111-8111-111111111111';
  service_harbour uuid := 'c2222222-2222-4222-8222-222222222222';
  booking_aura uuid := 'd1111111-1111-4111-8111-111111111111';
  booking_harbour uuid := 'd2222222-2222-4222-8222-222222222222';
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
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_aura,
      'authenticated',
      'authenticated',
      'admin@aura-salon.test',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Aura Admin"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_harbour,
      'authenticated',
      'authenticated',
      'admin@harbour-cafe.test',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Harbour Admin"}'::jsonb,
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
      user_aura,
      user_aura,
      format('{"sub":"%s","email":"admin@aura-salon.test"}', user_aura)::jsonb,
      'email',
      user_aura::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      user_harbour,
      user_harbour,
      format('{"sub":"%s","email":"admin@harbour-cafe.test"}', user_harbour)::jsonb,
      'email',
      user_harbour::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (id) do nothing;

  insert into public.profiles (id, email, full_name, platform_role)
  values
    (user_meridian, 'admin@meridian.test', 'Meridian Admin', 'meridian_admin'),
    (user_aura, 'admin@aura-salon.test', 'Aura Admin', null),
    (user_harbour, 'admin@harbour-cafe.test', 'Harbour Admin', null)
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      platform_role = excluded.platform_role;

  insert into public.businesses (id, name, slug)
  values
    (business_aura, 'Aura Salon', 'aura-salon'),
    (business_harbour, 'Harbour Café', 'harbour-cafe')
  on conflict (id) do nothing;

  insert into public.memberships (business_id, user_id, role)
  values
    (business_aura, user_aura, 'business_admin'),
    (business_harbour, user_harbour, 'business_admin')
  on conflict (business_id, user_id) do nothing;

  insert into public.booking_settings (
    business_id,
    notification_email,
    timezone,
    booking_mode
  )
  values
    (business_aura, 'bookings@aura-salon.test', 'Europe/London', 'meridian'),
    (business_harbour, 'bookings@harbour-cafe.test', 'Europe/London', 'meridian')
  on conflict (business_id) do nothing;

  insert into public.services (id, business_id, name, description, duration_minutes)
  values
    (
      service_aura,
      business_aura,
      'Cut & finish',
      'Classic cut and blow-dry',
      60
    ),
    (
      service_harbour,
      business_harbour,
      'Dinner table for two',
      'Evening dining request',
      90
    )
  on conflict (id) do nothing;

  insert into public.bookings (
    id,
    business_id,
    service_id,
    customer_name,
    customer_email,
    customer_phone,
    preferred_date,
    preferred_time,
    guest_count,
    notes,
    status,
    privacy_consent_at
  )
  values
    (
      booking_aura,
      business_aura,
      service_aura,
      'Sam Taylor',
      'sam@example.com',
      '+447700900111',
      current_date + 7,
      '10:30',
      1,
      'First visit',
      'pending',
      timezone('utc', now())
    ),
    (
      booking_harbour,
      business_harbour,
      service_harbour,
      'Jordan Lee',
      'jordan@example.com',
      '+447700900222',
      current_date + 3,
      '19:00',
      2,
      'Window seat if possible',
      'pending',
      timezone('utc', now())
    )
  on conflict (id) do nothing;

  insert into public.booking_events (
    business_id,
    booking_id,
    event_type,
    payload
  )
  values
    (
      business_aura,
      booking_aura,
      'booking.created',
      '{"source":"seed"}'::jsonb
    ),
    (
      business_harbour,
      booking_harbour,
      'booking.created',
      '{"source":"seed"}'::jsonb
    );

  insert into public.audit_logs (
    business_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values
    (
      business_aura,
      user_meridian,
      'seed.created',
      'business',
      business_aura,
      '{"label":"aura-salon"}'::jsonb
    ),
    (
      business_harbour,
      user_meridian,
      'seed.created',
      'business',
      business_harbour,
      '{"label":"harbour-cafe"}'::jsonb
    );
end;
$$;
