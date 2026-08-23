import "server-only";

import { Resend } from "resend";

type BookingEmailPayload = {
  businessName: string;
  notificationEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: number | null;
  notes: string | null;
};

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Meridian Bookings <onboarding@resend.dev>";
}

export async function sendBookingRequestEmails(
  payload: BookingEmailPayload,
): Promise<{ customerSent: boolean; businessSent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      "[email] RESEND_API_KEY not set — skipping booking notification emails",
    );
    return { customerSent: false, businessSent: false };
  }

  const when = `${payload.preferredDate} at ${payload.preferredTime}`;

  const customerResult = await resend.emails.send({
    from: fromAddress(),
    to: payload.customerEmail,
    subject: `Request received — ${payload.businessName}`,
    text: [
      `Hi ${payload.customerName},`,
      "",
      `We've received your booking request for ${payload.businessName}.`,
      "",
      `Service: ${payload.serviceName}`,
      `Preferred time: ${when}`,
      payload.guestCount ? `Guests: ${payload.guestCount}` : null,
      "",
      "This is a request acknowledgement only — your booking is not confirmed yet.",
      "The business will review your request and get back to you.",
      "",
      "Thanks,",
      "Meridian Bookings",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const businessResult = await resend.emails.send({
    from: fromAddress(),
    to: payload.notificationEmail,
    subject: `New booking request — ${payload.customerName}`,
    text: [
      `New booking request for ${payload.businessName}`,
      "",
      `Customer: ${payload.customerName}`,
      `Email: ${payload.customerEmail}`,
      payload.customerPhone ? `Phone: ${payload.customerPhone}` : null,
      `Service: ${payload.serviceName}`,
      `Preferred time: ${when}`,
      payload.guestCount ? `Guests: ${payload.guestCount}` : null,
      payload.notes ? `Notes: ${payload.notes}` : null,
      "",
      "Status: Pending — review this request in your Meridian dashboard.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return {
    customerSent: !customerResult.error,
    businessSent: !businessResult.error,
  };
}
