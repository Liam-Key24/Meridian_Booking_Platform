export function buildEmailOperationKey(params: {
  emailType: string;
  bookingId?: string | null;
  recipientEmail: string;
}): string {
  const bookingPart = params.bookingId?.trim() || "none";
  return `${params.emailType.toLowerCase()}:${bookingPart}:${params.recipientEmail.trim().toLowerCase()}`;
}
