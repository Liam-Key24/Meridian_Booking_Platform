import type { ClassValue } from "@/types/ui";

/** Join class names, omitting falsy values. */
export function cn(...values: ClassValue[]): string {
  return values
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value.filter(Boolean);
      return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([className]) => className);
    })
    .join(" ");
}
