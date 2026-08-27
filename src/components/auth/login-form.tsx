"use client";

import Link from "next/link";
import { useActionState, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { validateLoginCredentials } from "@/lib/auth/login-validation";
import {
  isPasswordResetAvailable,
  PASSWORD_RESET_HREF,
} from "@/lib/auth/password-reset";

const initialState: AuthActionState = { error: null, field: null };

type LoginFormProps = {
  next: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<{
    field: "email" | "password" | "form";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formErrorId = useId();
  const emailFieldId = useId();
  const passwordFieldId = useId();

  const [state, dispatch, actionPending] = useActionState(
    signIn,
    initialState,
  );

  const pending = actionPending || isPending;

  const emailError =
    clientError?.field === "email"
      ? clientError.message
      : state.field === "email"
        ? state.error
        : undefined;
  const passwordError =
    clientError?.field === "password"
      ? clientError.message
      : state.field === "password"
        ? state.error
        : undefined;
  const formError =
    clientError?.field === "form"
      ? clientError.message
      : state.field === "form" || (!state.field && state.error)
        ? state.error
        : null;

  const showForgotPassword = isPasswordResetAvailable();

  function handleSubmit(formData: FormData) {
    if (pending) {
      return;
    }

    const validation = validateLoginCredentials(
      formData.get("email"),
      formData.get("password"),
    );

    if (!validation.ok) {
      setClientError({ field: validation.field, message: validation.error });
      return;
    }

    setClientError(null);
    formData.set("email", validation.email);
    formData.set("password", validation.password);
    formData.set("next", next);

    startTransition(() => {
      dispatch(formData);
    });
  }

  function handleReset() {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setClientError(null);
  }

  return (
    <form
      action={handleSubmit}
      onReset={handleReset}
      className="space-y-5"
      noValidate
      aria-describedby={formError ? formErrorId : undefined}
    >
      <input type="hidden" name="next" value={next} />

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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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

      <div className="space-y-2">
        <label className="flex w-full flex-col gap-1.5 text-sm">
          <span className="font-medium text-meridian-text">Password</span>
          <span className="relative block">
            <input
              id={passwordFieldId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
              required
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={
                passwordError ? `${passwordFieldId}-error` : undefined
              }
              className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 pr-12 text-meridian-text placeholder:text-meridian-text-muted/70 transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70 aria-[invalid=true]:border-meridian-status-declined"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-meridian-sm text-meridian-text-muted transition-colors hover:bg-meridian-surface-subtle hover:text-meridian-text focus-visible:shadow-[var(--meridian-focus-ring)] disabled:opacity-50"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={pending}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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

        {showForgotPassword ? (
          <p className="text-sm">
            <Link
              href={PASSWORD_RESET_HREF}
              className="font-medium text-meridian-teal hover:text-[#125a69] hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          id={formErrorId}
          className="rounded-meridian-sm border border-meridian-status-declined/25 bg-meridian-status-declined-bg px-3.5 py-3 text-sm text-meridian-status-declined"
          role="alert"
          aria-live="assertive"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.75 2.75 0 0 0 3.8 3.8" />
      <path d="M9.9 5.6A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-3.2 3.6" />
      <path d="M6.5 6.7A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.9-.8" />
    </svg>
  );
}
