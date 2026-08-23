import "server-only";

import { Resend } from "resend";
import { buildBookingIcs } from "@/lib/booking/ics";
import { logEmailDelivery } from "@/lib/booking/email-log";

type BasePayload = {
  businessId: string;
  businessName: string;
  notificationEmail: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  durationMinutes: number;
  bookingId: string;
};

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Meridian Bookings <onboarding@resend.dev>";
}

function whenLabel(date: string, time: string): string {
  return `${date} at ${time.slice(0, 5)}`;
}

async function recordDecisionEmail(params: {
  payload: BasePayload;
  emailType: string;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}) {
  await logEmailDelivery({
    businessId: params.payload.businessId,
    bookingId: params.payload.bookingId,
    emailType: params.emailType,
    recipientEmail: params.payload.customerEmail,
    status: params.status,
    providerMessageId: params.providerMessageId,
    errorMessage: params.errorMessage,
  });
}

export async function sendBookingConfirmedEmail(
  payload: BasePayload,
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set — skipping confirmation email");
    await recordDecisionEmail({
      payload,
      emailType: "booking.confirmed",
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    return false;
  }

  const ics = buildBookingIcs({
    uid: `${payload.bookingId}@meridian.bookings`,
    title: `${payload.serviceName} — ${payload.businessName}`,
    description: `Confirmed booking with ${payload.businessName}`,
    startDate: payload.preferredDate,
    startTime: payload.preferredTime,
    durationMinutes: payload.durationMinutes,
    timezone: payload.timezone,
    organizerName: payload.businessName,
    organizerEmail: payload.notificationEmail,
    attendeeName: payload.customerName,
    attendeeEmail: payload.customerEmail,
  });

  const result = await resend.emails.send({
    from: fromAddress(),
    to: payload.customerEmail,
    subject: `Booking confirmed — ${payload.businessName}`,
    text: [
      `Hi ${payload.customerName},`,
      "",
      `Your booking with ${payload.businessName} is confirmed.`,
      "",
      `Service: ${payload.serviceName}`,
      `When: ${whenLabel(payload.preferredDate, payload.preferredTime)} (${payload.timezone})`,
      "",
      "A calendar invitation (.ics) is attached.",
      "",
      "Thanks,",
      payload.businessName,
    ].join("\n"),
    attachments: [
      {
        filename: "booking.ics",
        content: Buffer.from(ics, "utf8"),
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });

  await recordDecisionEmail({
    payload,
    emailType: "booking.confirmed",
    status: result.error ? "failed" : "sent",
    providerMessageId: !result.error && result.data ? result.data.id : null,
    errorMessage: result.error?.message ?? null,
  });

  return !result.error;
}

export async function sendBookingDeclinedEmail(
  payload: BasePayload & { reason?: string | null },
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    await recordDecisionEmail({
      payload,
      emailType: "booking.declined",
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    return false;
  }

  const result = await resend.emails.send({
    from: fromAddress(),
    to: payload.customerEmail,
    subject: `Update on your request — ${payload.businessName}`,
    text: [
      `Hi ${payload.customerName},`,
      "",
      `Thank you for your booking request with ${payload.businessName}.`,
      `Unfortunately we are unable to offer that time.`,
      "",
      `Service: ${payload.serviceName}`,
      `Requested: ${whenLabel(payload.preferredDate, payload.preferredTime)}`,
      payload.reason ? `Note: ${payload.reason}` : null,
      "",
      "You are welcome to submit another request for a different time.",
      "",
      "Kind regards,",
      payload.businessName,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  await recordDecisionEmail({
    payload,
    emailType: "booking.declined",
    status: result.error ? "failed" : "sent",
    providerMessageId: !result.error && result.data ? result.data.id : null,
    errorMessage: result.error?.message ?? null,
  });

  return !result.error;
}

export async function sendBookingSuggestedEmail(
  payload: BasePayload & {
    suggestedDate: string;
    suggestedTime: string;
  },
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    await recordDecisionEmail({
      payload,
      emailType: "booking.suggested",
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    return false;
  }

  const result = await resend.emails.send({
    from: fromAddress(),
    to: payload.customerEmail,
    subject: `Suggested time — ${payload.businessName}`,
    text: [
      `Hi ${payload.customerName},`,
      "",
      `${payload.businessName} has suggested another time for your request.`,
      "",
      `Service: ${payload.serviceName}`,
      `Originally requested: ${whenLabel(payload.preferredDate, payload.preferredTime)}`,
      `Suggested: ${whenLabel(payload.suggestedDate, payload.suggestedTime)} (${payload.timezone})`,
      "",
      "Please reply to the business if this works for you.",
      "",
      "Kind regards,",
      payload.businessName,
    ].join("\n"),
  });

  await recordDecisionEmail({
    payload,
    emailType: "booking.suggested",
    status: result.error ? "failed" : "sent",
    providerMessageId: !result.error && result.data ? result.data.id : null,
    errorMessage: result.error?.message ?? null,
  });

  return !result.error;
}

export async function sendBookingCancelledEmail(
  payload: BasePayload,
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    await recordDecisionEmail({
      payload,
      emailType: "booking.cancelled",
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    return false;
  }

  const result = await resend.emails.send({
    from: fromAddress(),
    to: payload.customerEmail,
    subject: `Booking cancelled — ${payload.businessName}`,
    text: [
      `Hi ${payload.customerName},`,
      "",
      `Your booking with ${payload.businessName} has been cancelled.`,
      "",
      `Service: ${payload.serviceName}`,
      `Was scheduled: ${whenLabel(payload.preferredDate, payload.preferredTime)}`,
      "",
      "If you still need an appointment, please submit a new request.",
      "",
      "Kind regards,",
      payload.businessName,
    ].join("\n"),
  });

  await recordDecisionEmail({
    payload,
    emailType: "booking.cancelled",
    status: result.error ? "failed" : "sent",
    providerMessageId: !result.error && result.data ? result.data.id : null,
    errorMessage: result.error?.message ?? null,
  });

  return !result.error;
}
