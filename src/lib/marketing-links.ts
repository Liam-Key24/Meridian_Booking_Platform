/**
 * Marketing website legal pages. The marketing site is a separate product
 * from this booking platform (see README). No public URLs were found in-repo;
 * `meridian.book` matches the ICS domain family (`@meridian.bookings`).
 * Override with NEXT_PUBLIC_MARKETING_SITE_URL when the live domain is set.
 */
const MARKETING_SITE_URL = (
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL ?? "https://meridian.book"
).replace(/\/$/, "");

export const MARKETING_TERMS_URL = `${MARKETING_SITE_URL}/terms`;
export const MARKETING_PRIVACY_URL = `${MARKETING_SITE_URL}/privacy`;
