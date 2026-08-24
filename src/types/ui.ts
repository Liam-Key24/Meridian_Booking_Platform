export type ClassValue =
  | string
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

/** Shared booking status values used by UI primitives (data layer comes later). */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "suggested"
  | "no_show";

export type BookingMode = "meridian" | "external" | "hybrid";
