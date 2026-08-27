/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
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

describe("LoginForm forgot-password when reset is implemented", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    signInMock.mockReset();
  });

  it("always shows Forgot password? when reset is available", () => {
    render(<LoginForm next="/dashboard" />);
    const link = screen.getByRole("link", { name: /forgot password/i });
    expect(link.getAttribute("href")).toBe("/login/forgot-password");
  });
});
