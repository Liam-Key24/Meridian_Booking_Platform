/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth/actions", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("@/lib/auth/password-reset", () => ({
  PASSWORD_RESET_AVAILABLE: true,
  PASSWORD_RESET_HREF: "/login/forgot-password",
  isPasswordResetAvailable: () => true,
}));

import { LoginForm } from "@/components/auth/login-form";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/login-validation";

describe("LoginForm forgot-password when reset is implemented", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue({
      error: GENERIC_AUTH_ERROR,
      field: "form",
    });
  });

  it("reveals Forgot password? only after three failed attempts", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^email$/i), "owner@business-a.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");

    expect(screen.queryByRole("link", { name: /forgot password/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.queryByRole("link", { name: /forgot password/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("link", { name: /forgot password/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /forgot password/i });
      expect(link.getAttribute("href")).toBe("/login/forgot-password");
    });
  });
});
