/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();

vi.mock("@/lib/auth/actions", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("@/lib/auth/password-reset", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/auth/password-reset")
  >("@/lib/auth/password-reset");
  return {
    ...actual,
    PASSWORD_RESET_AVAILABLE: false,
    isPasswordResetAvailable: () => false,
  };
});

import { LoginForm } from "@/components/auth/login-form";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/login-validation";

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    signInMock.mockReset();
  });

  it("validates empty email before calling sign-in", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/enter your email address/i)).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("validates invalid email format before calling sign-in", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^email$/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/valid email address/i)).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("validates empty password before calling sign-in", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^email$/i), "owner@business-a.test");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/enter your password/i)).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/dashboard" />);

    const password = screen.getByLabelText(/^password$/i);
    expect(password).toHaveProperty("type", "password");
    expect(password.getAttribute("autocomplete")).toBe("current-password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveProperty("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(password).toHaveProperty("type", "password");
  });

  it("shows a generic auth error and prevents duplicate submits while pending", async () => {
    const user = userEvent.setup();
    const deferred: {
      resolve: (value: { error: string; field: "form" }) => void;
    } = {
      resolve: () => undefined,
    };

    signInMock.mockImplementation(
      () =>
        new Promise<{ error: string; field: "form" }>((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^email$/i), "owner@business-a.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");

    const submit = screen.getByRole("button", { name: /^sign in$/i });
    await user.click(submit);

    expect(
      await screen.findByRole("button", { name: /signing in/i }),
    ).toBeTruthy();
    expect(submit).toHaveProperty("disabled", true);

    await user.click(submit);
    expect(signInMock).toHaveBeenCalledTimes(1);

    deferred.resolve({ error: GENERIC_AUTH_ERROR, field: "form" });

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      GENERIC_AUTH_ERROR,
    );
  });

  it("keeps forgot-password hidden when reset is unavailable", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({
      error: GENERIC_AUTH_ERROR,
      field: "form",
    });

    render(<LoginForm next="/dashboard" />);

    await user.type(screen.getByLabelText(/^email$/i), "owner@business-a.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await user.click(screen.getByRole("button", { name: /^sign in$/i }));
      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toBe(GENERIC_AUTH_ERROR);
      });
    }

    expect(signInMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole("link", { name: /forgot password/i })).toBeNull();
  });

  it("does not include social login or registration options", () => {
    render(<LoginForm next="/dashboard" />);
    expect(screen.queryByText(/google/i)).toBeNull();
    expect(screen.queryByText(/apple/i)).toBeNull();
    expect(screen.queryByText(/create account/i)).toBeNull();
    expect(screen.queryByText(/register/i)).toBeNull();
  });
});
