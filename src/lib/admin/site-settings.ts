/**
 * Client site branding / menus stored per business.
 * Future template renderers read this store — not template rows.
 */

import type { Json } from "@/types/database";

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  dietary: string[];
};

export type MenuSection = {
  id: string;
  title: string;
  visible: boolean;
  items: MenuItem[];
};

export type BusinessMenu = {
  sections: MenuSection[];
};

export const DEFAULT_BRAND_COLORS = {
  primary_color: "#0F766E",
  accent_color: "#0D9488",
  background_color: "#FFFFFF",
  text_color: "#0F172A",
} as const;

export const BUSINESS_ASSETS_BUCKET = "business-assets";

export function emptyMenu(): BusinessMenu {
  return { sections: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseBusinessMenu(value: unknown): BusinessMenu {
  if (!isRecord(value) || !Array.isArray(value.sections)) {
    return emptyMenu();
  }

  const sections: MenuSection[] = [];
  for (const raw of value.sections) {
    if (!isRecord(raw)) continue;
    const id = typeof raw.id === "string" ? raw.id : crypto.randomUUID();
    const title = typeof raw.title === "string" ? raw.title : "Untitled";
    const visible = raw.visible !== false;
    const items: MenuItem[] = [];
    if (Array.isArray(raw.items)) {
      for (const item of raw.items) {
        if (!isRecord(item)) continue;
        items.push({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          name: typeof item.name === "string" ? item.name : "",
          description:
            typeof item.description === "string" ? item.description : "",
          price: typeof item.price === "string" ? item.price : "",
          dietary: Array.isArray(item.dietary)
            ? item.dietary.filter((d): d is string => typeof d === "string")
            : [],
        });
      }
    }
    sections.push({ id, title, visible, items });
  }
  return { sections };
}

export function menuToJson(menu: BusinessMenu): Json {
  return menu as unknown as Json;
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUSINESS_ASSETS_BUCKET}/${path}`;
}
