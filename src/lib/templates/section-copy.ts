import type { Json } from "@/types/database";

export type SiteTestimonial = {
  quote: string;
  name: string;
};

export type SiteSectionCopy = {
  hero_heading: string;
  hero_body: string;
  hero_primary_cta: string;
  hero_secondary_cta: string;
  about_heading: string;
  about_body: string;
  gallery_heading: string;
  gallery_body: string;
  testimonials_heading: string;
  testimonials: SiteTestimonial[];
  contact_tagline: string;
  contact_visit: string;
};

export const DEFAULT_SITE_COPY: SiteSectionCopy = {
  hero_heading: "A New Chapter in Fine Dining.",
  hero_body:
    "Experience culinary excellence in an intimate setting, where every dish tells a story of locally-sourced ingredients and masterful technique.",
  hero_primary_cta: "Reserve Your Table",
  hero_secondary_cta: "View Menu",
  about_heading: "Rooted in Seasonality,\nDriven by Passion.",
  about_body:
    "Our culinary philosophy celebrates the rhythm of the seasons. Each dish is crafted with ingredients sourced from local farmers, fishermen, and artisans who share our commitment to quality.\n\nFrom the first course to the last, we invite you to savour an experience that honours tradition while embracing innovation.",
  gallery_heading: "Moments & Details",
  gallery_body:
    "A glimpse into the atmosphere and artistry that defines this restaurant.",
  testimonials_heading: "Guest Experiences",
  testimonials: [
    {
      quote:
        "An unforgettable evening. Every course felt intentional and the service was impeccable.",
      name: "Sarah L.",
    },
    {
      quote:
        "The seasonal menu exceeded our expectations. We will be returning soon.",
      name: "James & Olivia",
    },
    {
      quote: "Warm, elegant, and delicious. A true gem for special occasions.",
      name: "Michael R.",
    },
  ],
  contact_tagline:
    "Fine dining with seasonal ingredients and warm hospitality.",
  contact_visit: "Book online or contact us directly for private events.",
};

const LIMITS = {
  heading: 160,
  body: 1200,
  cta: 48,
  quote: 400,
  name: 80,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function parseTestimonials(value: unknown): SiteTestimonial[] {
  if (!Array.isArray(value)) return DEFAULT_SITE_COPY.testimonials;
  const rows = value
    .filter(isRecord)
    .map((raw) => ({
      quote: clip(raw.quote, LIMITS.quote),
      name: clip(raw.name, LIMITS.name),
    }))
    .filter((row) => row.quote || row.name);
  return rows.length > 0 ? rows.slice(0, 3) : DEFAULT_SITE_COPY.testimonials;
}

export function parseSiteSectionCopy(value: unknown): SiteSectionCopy {
  const raw = isRecord(value) ? value : {};
  return {
    hero_heading: clip(raw.hero_heading, LIMITS.heading),
    hero_body: clip(raw.hero_body, LIMITS.body),
    hero_primary_cta: clip(raw.hero_primary_cta, LIMITS.cta),
    hero_secondary_cta: clip(raw.hero_secondary_cta, LIMITS.cta),
    about_heading: clip(raw.about_heading, LIMITS.heading),
    about_body: clip(raw.about_body, LIMITS.body),
    gallery_heading: clip(raw.gallery_heading, LIMITS.heading),
    gallery_body: clip(raw.gallery_body, LIMITS.body),
    testimonials_heading: clip(raw.testimonials_heading, LIMITS.heading),
    testimonials: parseTestimonials(raw.testimonials),
    contact_tagline: clip(raw.contact_tagline, LIMITS.body),
    contact_visit: clip(raw.contact_visit, LIMITS.body),
  };
}

export function resolveSiteSectionCopy(
  saved: SiteSectionCopy,
  fallbacks: Partial<SiteSectionCopy> = {},
): SiteSectionCopy {
  const pick = (key: keyof Omit<SiteSectionCopy, "testimonials">) =>
    saved[key] || fallbacks[key] || DEFAULT_SITE_COPY[key];

  const testimonials = saved.testimonials.some((row) => row.quote && row.name)
    ? saved.testimonials
        .filter((row) => row.quote && row.name)
        .slice(0, 3)
    : DEFAULT_SITE_COPY.testimonials;

  return {
    hero_heading: pick("hero_heading"),
    hero_body: pick("hero_body"),
    hero_primary_cta: pick("hero_primary_cta"),
    hero_secondary_cta: pick("hero_secondary_cta"),
    about_heading: pick("about_heading"),
    about_body: pick("about_body"),
    gallery_heading: pick("gallery_heading"),
    gallery_body: pick("gallery_body"),
    testimonials_heading: pick("testimonials_heading"),
    testimonials,
    contact_tagline: pick("contact_tagline"),
    contact_visit: pick("contact_visit"),
  };
}

export function mergeSectionCopyFromFormData(
  formData: FormData,
  current: SiteSectionCopy,
): SiteSectionCopy {
  const incoming = sectionCopyFromFormData(formData);
  const pick = (
    name: string,
    key: keyof Omit<SiteSectionCopy, "testimonials">,
  ) => (formData.has(name) ? incoming[key] : current[key]);

  return {
    hero_heading: pick("heroHeading", "hero_heading"),
    hero_body: pick("heroBody", "hero_body"),
    hero_primary_cta: pick("heroPrimaryCta", "hero_primary_cta"),
    hero_secondary_cta: pick("heroSecondaryCta", "hero_secondary_cta"),
    about_heading: pick("aboutHeading", "about_heading"),
    about_body: pick("aboutBody", "about_body"),
    gallery_heading: pick("galleryHeading", "gallery_heading"),
    gallery_body: pick("galleryBody", "gallery_body"),
    testimonials_heading: pick("testimonialsHeading", "testimonials_heading"),
    testimonials: formData.has("testimonialsHeading")
      ? incoming.testimonials
      : current.testimonials,
    contact_tagline: pick("contactTagline", "contact_tagline"),
    contact_visit: pick("contactVisit", "contact_visit"),
  };
}

export function sectionCopyFromFormData(formData: FormData): SiteSectionCopy {
  const read = (name: string, max: number) =>
    clip(formData.get(name), max);

  return {
    hero_heading: read("heroHeading", LIMITS.heading),
    hero_body: read("heroBody", LIMITS.body),
    hero_primary_cta: read("heroPrimaryCta", LIMITS.cta),
    hero_secondary_cta: read("heroSecondaryCta", LIMITS.cta),
    about_heading: read("aboutHeading", LIMITS.heading),
    about_body: read("aboutBody", LIMITS.body),
    gallery_heading: read("galleryHeading", LIMITS.heading),
    gallery_body: read("galleryBody", LIMITS.body),
    testimonials_heading: read("testimonialsHeading", LIMITS.heading),
    testimonials: [1, 2, 3].map((index) => ({
      quote: read(`testimonial${index}Quote`, LIMITS.quote),
      name: read(`testimonial${index}Name`, LIMITS.name),
    })),
    contact_tagline: read("contactTagline", LIMITS.body),
    contact_visit: read("contactVisit", LIMITS.body),
  };
}

export function sectionCopyToJson(copy: SiteSectionCopy): Json {
  return copy as unknown as Json;
}

export function splitCopyParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
