"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { signIn, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />
      {state.error ? (
        <p className="text-sm text-meridian-status-declined" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Continue"}
      </Button>
    </form>
  );
}
