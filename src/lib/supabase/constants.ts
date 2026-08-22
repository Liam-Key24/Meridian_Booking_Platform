/**
 * Deterministic seed IDs used by migrations/tests.
 * Keep in sync with supabase/seed.sql.
 */
export const SEED = {
  businesses: {
    aura: {
      id: "a1111111-1111-4111-8111-111111111111",
      slug: "aura-salon",
      name: "Aura Salon",
    },
    harbour: {
      id: "b2222222-2222-4222-8222-222222222222",
      slug: "harbour-cafe",
      name: "Harbour Café",
    },
  },
  users: {
    meridianAdmin: {
      id: "01111111-1111-4111-8111-111111111101",
      email: "admin@meridian.test",
      password: "Password123!",
    },
    auraAdmin: {
      id: "0a111111-1111-4111-8111-11111111110a",
      email: "admin@aura-salon.test",
      password: "Password123!",
    },
    harbourAdmin: {
      id: "0b222222-2222-4222-8222-22222222220b",
      email: "admin@harbour-cafe.test",
      password: "Password123!",
    },
  },
  bookings: {
    aura: "d1111111-1111-4111-8111-111111111111",
    harbour: "d2222222-2222-4222-8222-222222222222",
  },
} as const;

export const CLIENT_OWNED_TABLES = [
  "businesses",
  "memberships",
  "booking_settings",
  "services",
  "bookings",
  "booking_events",
  "audit_logs",
] as const;

export const RLS_TABLES = [
  "businesses",
  "profiles",
  "memberships",
  "booking_settings",
  "services",
  "bookings",
  "booking_events",
  "audit_logs",
] as const;
