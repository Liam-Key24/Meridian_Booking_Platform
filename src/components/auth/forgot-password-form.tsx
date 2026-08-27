"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui";
import {
  requestPasswordReset,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = {
  error: null,
  field: null,
  success: null,
};

export function ForgotPasswordForm() {
  const emailFieldId = useId();
  const formErrorId = useId();
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  const emailError =
    state.field === "email" ? state.error : undefined;
  const formError =
    state.field === "form" || (!state.field && state.error)
      ? state.error
      : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      <label className="flex w-full flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">Email</span>
        <input
          id={emailFieldId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="you@business.com"
          disabled={pending}
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${emailFieldId}-error` : undefined}
          className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text placeholder:text-meridian-text-muted/70 transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70 aria-[invalid=true]:border-meridian-status-declined"
        />
        {emailError ? (
          <span
            id={`${emailFieldId}-error`}
            className="text-meridian-status-declined"
          >
            {emailError}
          </span>
        ) : null}
      </label>

      {formError ? (
        <p
          id={formErrorId}
          className="rounded-meridian-sm border border-meridian-status-declined/25 bg-meridian-status-declined-bg px-3.5 py-3 text-sm text-meridian-status-declined"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="rounded-meridian-sm border border-meridian-status-confirmed/25 bg-meridian-status-confirmed-bg px-3.5 py-3 text-sm text-meridian-status-confirmed"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-meridian-text-muted">
        <Link
          href="/login"
          className="font-medium text-meridian-teal hover:text-[#125a69] hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
