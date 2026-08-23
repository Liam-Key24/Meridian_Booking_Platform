export const ALLERGY_CODES = [
  "celery",
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphites",
] as const;

export type AllergyCode = (typeof ALLERGY_CODES)[number];

export type AllergyDefinition = {
  code: AllergyCode;
  label: string;
  shortLabel: string;
  /** Tailwind-friendly text + soft background pair */
  textClass: string;
  bgClass: string;
};

export const ALLERGY_CATALOG: Record<AllergyCode, AllergyDefinition> = {
  celery: {
    code: "celery",
    label: "Celery",
    shortLabel: "Celery",
    textClass: "text-[#2f6b3a]",
    bgClass: "bg-[#e7f4ea]",
  },
  gluten: {
    code: "gluten",
    label: "Cereals containing gluten",
    shortLabel: "Gluten",
    textClass: "text-[#8a5a12]",
    bgClass: "bg-[#f8edd8]",
  },
  crustaceans: {
    code: "crustaceans",
    label: "Crustaceans",
    shortLabel: "Crustacea",
    textClass: "text-[#b42318]",
    bgClass: "bg-[#fde8e6]",
  },
  eggs: {
    code: "eggs",
    label: "Eggs",
    shortLabel: "Eggs",
    textClass: "text-[#9a6b00]",
    bgClass: "bg-[#fff3d6]",
  },
  fish: {
    code: "fish",
    label: "Fish",
    shortLabel: "Fish",
    textClass: "text-[#0f5f8a]",
    bgClass: "bg-[#e3f2fa]",
  },
  lupin: {
    code: "lupin",
    label: "Lupin",
    shortLabel: "Lupin",
    textClass: "text-[#6b3fa0]",
    bgClass: "bg-[#f1e8fb]",
  },
  milk: {
    code: "milk",
    label: "Milk",
    shortLabel: "Milk",
    textClass: "text-[#355f8a]",
    bgClass: "bg-[#e8f0f8]",
  },
  molluscs: {
    code: "molluscs",
    label: "Molluscs",
    shortLabel: "Molluscs",
    textClass: "text-[#7a3d5c]",
    bgClass: "bg-[#f7e8ef]",
  },
  mustard: {
    code: "mustard",
    label: "Mustard",
    shortLabel: "Mustard",
    textClass: "text-[#9a7a00]",
    bgClass: "bg-[#fbf3cc]",
  },
  nuts: {
    code: "nuts",
    label: "Tree nuts",
    shortLabel: "Nuts",
    textClass: "text-[#7a4a1a]",
    bgClass: "bg-[#f4e6d6]",
  },
  peanuts: {
    code: "peanuts",
    label: "Peanuts",
    shortLabel: "Peanuts",
    textClass: "text-[#8a5a20]",
    bgClass: "bg-[#f6e9d4]",
  },
  sesame: {
    code: "sesame",
    label: "Sesame",
    shortLabel: "Sesame",
    textClass: "text-[#6b5a2a]",
    bgClass: "bg-[#f3ecd8]",
  },
  soybeans: {
    code: "soybeans",
    label: "Soybeans",
    shortLabel: "Soya",
    textClass: "text-[#3f6b2a]",
    bgClass: "bg-[#e8f3df]",
  },
  sulphites: {
    code: "sulphites",
    label: "Sulphur dioxide / sulphites",
    shortLabel: "Sulphites",
    textClass: "text-[#5a5a5a]",
    bgClass: "bg-[#ececec]",
  },
};

export function isAllergyCode(value: string): value is AllergyCode {
  return (ALLERGY_CODES as readonly string[]).includes(value);
}

export function normalizeAllergies(
  value: string[] | null | undefined,
): AllergyCode[] {
  if (!value?.length) return [];
  const seen = new Set<AllergyCode>();
  for (const item of value) {
    if (isAllergyCode(item)) seen.add(item);
  }
  return ALLERGY_CODES.filter((code) => seen.has(code));
}
