/** Deterministic seed IDs — keep in sync with supabase/seed.sql */
export const SEED = {
  businesses: {
    a: {
      id: "a1111111-1111-4111-8111-111111111111",
      slug: "business-a",
      name: "Business A",
    },
    b: {
      id: "b2222222-2222-4222-8222-222222222222",
      slug: "business-b",
      name: "Business B",
    },
  },
  users: {
    meridianAdmin: {
      id: "01111111-1111-4111-8111-111111111101",
      email: "admin@meridian.test",
      password: "Password123!",
    },
    businessAOwner: {
      id: "0a111111-1111-4111-8111-11111111110a",
      email: "owner@business-a.test",
      password: "Password123!",
    },
    businessBOwner: {
      id: "0b222222-2222-4222-8222-22222222220b",
      email: "owner@business-b.test",
      password: "Password123!",
    },
  },
} as const;
