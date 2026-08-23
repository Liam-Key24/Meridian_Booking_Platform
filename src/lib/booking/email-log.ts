import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type EmailDeliveryStatus = "sent" | "failed" | "skipped";

export type LogEmailDeliveryInput = {
  businessId?: string | null;
  bookingId?: string | null;
  emailType: string;
  recipientEmail: string;
  status: EmailDeliveryStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

/** Persist email attempt outcome for Meridian admin visibility. */
export async function logEmailDelivery(
  input: LogEmailDeliveryInput,
): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("email_delivery_logs").insert({
      business_id: input.businessId ?? null,
      booking_id: input.bookingId ?? null,
      email_type: input.emailType,
      recipient_email: input.recipientEmail,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      error_message: input.errorMessage ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });
    if (error) {
      console.error("[email-log] insert failed", error);
    }
  } catch (error) {
    console.error("[email-log] unexpected failure", error);
  }
}
