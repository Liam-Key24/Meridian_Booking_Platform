import "server-only";

import { Resend } from "resend";
import { logEmailDelivery } from "@/lib/booking/email-log";

type BookingEmailPayload = {
  businessId: string;
  bookingId: string;
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
    await logEmailDelivery({
      businessId: payload.businessId,
      bookingId: payload.bookingId,
      emailType: "booking.request.customer",
      recipientEmail: payload.customerEmail,
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    await logEmailDelivery({
      businessId: payload.businessId,
      bookingId: payload.bookingId,
      emailType: "booking.request.business",
      recipientEmail: payload.notificationEmail,
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
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

  await logEmailDelivery({
    businessId: payload.businessId,
    bookingId: payload.bookingId,
    emailType: "booking.request.customer",
    recipientEmail: payload.customerEmail,
    status: customerResult.error ? "failed" : "sent",
    providerMessageId:
      !customerResult.error && customerResult.data
        ? customerResult.data.id
        : null,
    errorMessage: customerResult.error?.message ?? null,
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

  await logEmailDelivery({
    businessId: payload.businessId,
    bookingId: payload.bookingId,
    emailType: "booking.request.business",
    recipientEmail: payload.notificationEmail,
    status: businessResult.error ? "failed" : "sent",
    providerMessageId:
      !businessResult.error && businessResult.data
        ? businessResult.data.id
        : null,
    errorMessage: businessResult.error?.message ?? null,
  });

  return {
    customerSent: !customerResult.error,
    businessSent: !businessResult.error,
  };
}
