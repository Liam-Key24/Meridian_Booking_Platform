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
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: number | null;
  notes: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function validateBookingRequest(
  input: BookingRequestInput,
): ValidationResult {
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
  if (customerPhone && (customerPhone.length < 7 || customerPhone.length > 40)) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  if (!input.serviceId.trim()) {
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
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
      return { ok: false, error: "Guest count must be between 1 and 100." };
    }
    guestCount = parsed;
  }

  const notes = input.notes.trim();
  if (notes.length > 2000) {
    return { ok: false, error: "Notes are too long." };
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
      customerPhone: customerPhone || null,
      serviceId: input.serviceId.trim(),
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      guestCount,
      notes: notes || null,
    },
  };
}
