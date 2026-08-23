-- EU 14 major allergen codes stored on bookings as a text array.

alter table public.bookings
  add column if not exists allergies text[] not null default '{}';

comment on column public.bookings.allergies is
  'EU major allergen codes declared for this booking (celery, gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, nuts, peanuts, sesame, soybeans, sulphites).';

alter table public.bookings
  drop constraint if exists bookings_allergies_codes_check;

alter table public.bookings
  add constraint bookings_allergies_codes_check
  check (
    allergies <@ array[
      'celery',
      'gluten',
      'crustaceans',
      'eggs',
      'fish',
      'lupin',
      'milk',
      'molluscs',
      'mustard',
      'nuts',
      'peanuts',
      'sesame',
      'soybeans',
      'sulphites'
    ]::text[]
  );
