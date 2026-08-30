export type BookingRequestInput = {
  businessSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: string;
  notes: string;
  allergies: string;
  noAllergies: boolean;
  privacyConsent: boolean;
  /** Honeypot — must remain empty */
  companyWebsite: string;
};

export type ValidationResult =
  | { ok: true; data: ValidatedBookingRequest }
  | { ok: false; error: string };

export type ValidatedBookingRequest = {
  businessSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceId: string | null;
  preferredDate: string;
  preferredTime: string;
  guestCount: number | null;
  notes: string | null;
  allergies: string[];
};

export type ValidateBookingOptions = {
  /** Default true (appointments). Hospitality public form may omit service. */
  requireService?: boolean;
  /** Hospitality: require a party size. */
  requireGuestCount?: boolean;
  /** Cap from booking_settings.max_party_size when set. */
  maxGuestCount?: number | null;
  /** Hospitality: require allergy declaration or explicit none. */
  requireAllergyDeclaration?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function validateBookingRequest(
  input: BookingRequestInput,
  options: ValidateBookingOptions = {},
): ValidationResult {
  const requireService = options.requireService ?? true;
  const requireGuestCount = options.requireGuestCount ?? false;
  const maxGuestCount = options.maxGuestCount ?? null;
  const requireAllergyDeclaration = options.requireAllergyDeclaration ?? false;

  if (input.companyWebsite.trim() !== "") {
    return { ok: false, error: "Unable to submit this request." };
  }

  const customerName = input.customerName.trim();
  if (customerName.length < 2 || customerName.length > 120) {
    return { ok: false, error: "Please enter your name." };
  }

  const customerEmail = input.customerEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(customerEmail) || customerEmail.length > 254) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const customerPhone = input.customerPhone.trim();
  if (!customerPhone || customerPhone.length < 7 || customerPhone.length > 40) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  const serviceId = input.serviceId.trim();
  if (requireService && !serviceId) {
    return { ok: false, error: "Please select a service." };
  }

  if (!DATE_RE.test(input.preferredDate)) {
    return { ok: false, error: "Please choose a preferred date." };
  }

  const preferred = new Date(`${input.preferredDate}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(preferred.getTime()) || preferred < today) {
    return { ok: false, error: "Preferred date must be today or later." };
  }

  if (!TIME_RE.test(input.preferredTime)) {
    return { ok: false, error: "Please choose a preferred time." };
  }

  let guestCount: number | null = null;
  const guestsRaw = input.guestCount.trim();
  if (guestsRaw) {
    const parsed = Number.parseInt(guestsRaw, 10);
    const upper = maxGuestCount && maxGuestCount > 0 ? maxGuestCount : 100;
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > upper) {
      return {
        ok: false,
        error:
          maxGuestCount && maxGuestCount > 0
            ? `Party size must be between 1 and ${maxGuestCount}.`
            : "Guest count must be between 1 and 100.",
      };
    }
    guestCount = parsed;
  } else if (requireGuestCount) {
    return { ok: false, error: "Please enter your party size." };
  }

  const notes = input.notes.trim();
  if (notes.length > 2000) {
    return { ok: false, error: "Notes are too long." };
  }

  const allergies = input.allergies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (requireAllergyDeclaration && !input.noAllergies && allergies.length === 0) {
    return {
      ok: false,
      error: "Please select allergies or choose No allergies.",
    };
  }

  if (!input.privacyConsent) {
    return {
      ok: false,
      error: "Please acknowledge the privacy notice to continue.",
    };
  }

  return {
    ok: true,
    data: {
      businessSlug: input.businessSlug.trim().toLowerCase(),
      customerName,
      customerEmail,
      customerPhone,
      serviceId: serviceId || null,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      guestCount,
      notes: notes || null,
      allergies: input.noAllergies ? [] : allergies,
    },
  };
}
