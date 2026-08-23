"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import {
  retryFailedEmail,
  type EmailRetryState,
} from "@/lib/booking/email-retry";

const initialState: EmailRetryState = { status: "idle", message: null };

export function EmailRetryButton({ logId }: { logId: string }) {
  const [state, action, pending] = useActionState(retryFailedEmail, initialState);

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="logId" value={logId} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Retrying…" : "Retry send"}
      </Button>
      {state.status !== "idle" ? (
        <p
          className={
            state.status === "error"
              ? "text-xs text-meridian-status-declined"
              : "text-xs text-meridian-teal"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
