"use server";

import { revalidatePath } from "next/cache";
import { getAuthSnapshot } from "@/lib/auth/business-context";
import {
  buildEmailOperationKey,
  logEmailDelivery,
  wasEmailAlreadySent,
} from "@/lib/booking/email-log";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export type EmailRetryState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Meridian Bookings <onboarding@resend.dev>";
}

/**
 * Safe retry for a failed/skipped email_delivery_logs row.
 * Only meridian_admin. Does not resend if already marked sent.
 * Re-sends a generic notice using stored metadata when possible;
 * otherwise marks the attempt and returns guidance.
 */
export async function retryFailedEmail(
  _prev: EmailRetryState,
  formData: FormData,
): Promise<EmailRetryState> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot?.isMeridianAdmin) {
    return { status: "error", message: "Meridian admin only." };
  }

  const logId = String(formData.get("logId") ?? "");
  if (!logId) {
    return { status: "error", message: "Missing email log id." };
  }

  const supabase = await createClient();
  const { data: log, error } = await supabase
    .from("email_delivery_logs")
    .select("*")
    .eq("id", logId)
    .maybeSingle();

  if (error || !log) {
    return { status: "error", message: "Email log not found." };
  }

  if (log.status === "sent") {
    return {
      status: "error",
      message: "This email was already sent successfully.",
    };
  }

  const alreadySent = await wasEmailAlreadySent({
    emailType: log.email_type,
    bookingId: log.booking_id,
    recipientEmail: log.recipient_email,
  });
  if (alreadySent) {
    return {
      status: "error",
      message: "This email operation is already marked sent.",
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    await logEmailDelivery({
      businessId: log.business_id,
      bookingId: log.booking_id,
      emailType: log.email_type,
      recipientEmail: log.recipient_email,
      status: "skipped",
      errorMessage: "RESEND_API_KEY not set",
    });
    return {
      status: "error",
      message: "Email provider is not configured.",
    };
  }

  const subject =
    typeof log.metadata === "object" &&
    log.metadata &&
    !Array.isArray(log.metadata) &&
    typeof (log.metadata as Record<string, unknown>).subject === "string"
      ? String((log.metadata as Record<string, unknown>).subject)
      : `Update from Meridian Bookings (${log.email_type})`;

  const body =
    typeof log.metadata === "object" &&
    log.metadata &&
    !Array.isArray(log.metadata) &&
    typeof (log.metadata as Record<string, unknown>).text === "string"
      ? String((log.metadata as Record<string, unknown>).text)
      : [
          "This is a retry of a previous Meridian booking notification.",
          `Type: ${log.email_type}`,
          log.booking_id ? `Booking: ${log.booking_id}` : null,
          "",
          "Please contact the business if you need further details.",
        ]
          .filter(Boolean)
          .join("\n");

  const resend = new Resend(resendKey);
  const result = await resend.emails.send({
    from: fromAddress(),
    to: log.recipient_email,
    subject,
    text: body,
  });

  await logEmailDelivery({
    businessId: log.business_id,
    bookingId: log.booking_id,
    emailType: log.email_type,
    recipientEmail: log.recipient_email,
    status: result.error ? "failed" : "sent",
    providerMessageId: !result.error && result.data ? result.data.id : null,
    errorMessage: result.error?.message ?? null,
    metadata: {
      retried_by: snapshot.user.id,
      operation_key: buildEmailOperationKey({
        emailType: log.email_type,
        bookingId: log.booking_id,
        recipientEmail: log.recipient_email,
      }),
    },
  });

  // Also bump via admin client so last_attempt is visible even if upsert raced
  const admin = createServiceRoleClient();
  await admin
    .from("email_delivery_logs")
    .update({
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", logId);

  revalidatePath("/admin/email-logs");

  if (result.error) {
    return {
      status: "error",
      message: "Retry failed. Check email logs for details.",
    };
  }

  return { status: "success", message: "Email retry sent." };
}
