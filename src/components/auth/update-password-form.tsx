"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui";
import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import { PASSWORD_RESET_HREF } from "@/lib/auth/password-reset";

const initialState: AuthActionState = {
  error: null,
  field: null,
  success: null,
};

export function UpdatePasswordForm() {
  const passwordFieldId = useId();
  const confirmFieldId = useId();
  const formErrorId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(updatePassword, initialState);

  const passwordError =
    state.field === "password" ? state.error : undefined;
  const formError =
    state.field === "form" || (!state.field && state.error)
      ? state.error
      : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      <label className="flex w-full flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">New password</span>
        <span className="relative block">
          <input
            id={passwordFieldId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={pending}
            required
            minLength={8}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={
              passwordError ? `${passwordFieldId}-error` : undefined
            }
            className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 pr-12 text-meridian-text placeholder:text-meridian-text-muted/70 transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70 aria-[invalid=true]:border-meridian-status-declined"
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-meridian-sm text-meridian-text-muted transition-colors hover:bg-meridian-surface-subtle hover:text-meridian-text"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={pending}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
        {passwordError ? (
          <span
            id={`${passwordFieldId}-error`}
            className="text-meridian-status-declined"
          >
            {passwordError}
          </span>
        ) : null}
      </label>

      <label className="flex w-full flex-col gap-1.5 text-sm">
        <span className="font-medium text-meridian-text">Confirm password</span>
        <input
          id={confirmFieldId}
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={pending}
          required
          minLength={8}
          className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text placeholder:text-meridian-text-muted/70 transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70"
        />
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

      <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>

      <p className="text-center text-sm text-meridian-text-muted">
        Link expired?{" "}
        <Link
          href={PASSWORD_RESET_HREF}
          className="font-medium text-meridian-teal hover:text-[#125a69] hover:underline"
        >
          Request a new one
        </Link>
      </p>
    </form>
  );
}
