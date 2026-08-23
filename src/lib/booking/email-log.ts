import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { buildEmailOperationKey } from "@/lib/booking/email-operation-key";
import type { Json } from "@/types/database";

export type EmailDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

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

export { buildEmailOperationKey };

/**
 * Upsert email attempt by deterministic operation_key.
 * Never creates a second "sent" row for the same operation.
 */
export async function logEmailDelivery(
  input: LogEmailDeliveryInput,
): Promise<{ id: string | null; alreadySent: boolean }> {
  try {
    const supabase = createServiceRoleClient();
    const operationKey = buildEmailOperationKey({
      emailType: input.emailType,
      bookingId: input.bookingId,
      recipientEmail: input.recipientEmail,
    });
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("email_delivery_logs")
      .select("id, status, attempt_count, provider_message_id")
      .eq("operation_key", operationKey)
      .maybeSingle();

    if (existing?.status === "sent") {
      return { id: existing.id, alreadySent: true };
    }

    if (existing) {
      const { data, error } = await supabase
        .from("email_delivery_logs")
        .update({
          status: input.status,
          attempt_count: (existing.attempt_count ?? 1) + 1,
          last_attempt_at: now,
          last_error: input.errorMessage ?? null,
          error_message: input.errorMessage ?? null,
          provider_message_id:
            input.providerMessageId ?? existing.provider_message_id ?? null,
          metadata: (input.metadata ?? {}) as Json,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) {
        console.error("[email-log] update failed", error);
        return { id: existing.id, alreadySent: false };
      }
      return { id: data.id, alreadySent: false };
    }

    const { data, error } = await supabase
      .from("email_delivery_logs")
      .insert({
        business_id: input.businessId ?? null,
        booking_id: input.bookingId ?? null,
        email_type: input.emailType,
        recipient_email: input.recipientEmail,
        status: input.status,
        provider_message_id: input.providerMessageId ?? null,
        error_message: input.errorMessage ?? null,
        last_error: input.errorMessage ?? null,
        operation_key: operationKey,
        attempt_count: 1,
        last_attempt_at: now,
        metadata: (input.metadata ?? {}) as Json,
      })
      .select("id")
      .single();

    if (error) {
      // Unique race: treat as already handled
      if (error.code === "23505") {
        return { id: null, alreadySent: true };
      }
      console.error("[email-log] insert failed", error);
      return { id: null, alreadySent: false };
    }

    return { id: data.id, alreadySent: false };
  } catch (error) {
    console.error("[email-log] unexpected failure", error);
    return { id: null, alreadySent: false };
  }
}

/** Returns true if this operation was already successfully sent. */
export async function wasEmailAlreadySent(params: {
  emailType: string;
  bookingId?: string | null;
  recipientEmail: string;
}): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const operationKey = buildEmailOperationKey(params);
  const { data } = await supabase
    .from("email_delivery_logs")
    .select("status")
    .eq("operation_key", operationKey)
    .maybeSingle();
  return data?.status === "sent";
}
