import type { BookingMode, BookingStatus } from "@/types/database";

export type ClassValue =
  | string
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

export type { BookingMode, BookingStatus };