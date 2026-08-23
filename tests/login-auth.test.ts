import { describe, expect, it } from "vitest";
import {
  FAILED_ATTEMPTS_BEFORE_RESET_HINT,
  incrementFailedAttempts,
  resetFailedAttempts,
  shouldShowForgotPassword,
} from "@/lib/auth/failed-attempts";
import {
  GENERIC_AUTH_ERROR,
  validateLoginCredentials,
} from "@/lib/auth/login-validation";
import { PASSWORD_RESET_AVAILABLE } from "@/lib/auth/password-reset";
import {
  getDefaultPostLoginPath,
  getSafeRedirectPath,
  resolvePostLoginPath,
} from "@/lib/auth/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("accepts safe internal next destinations", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/admin")).toBe("/admin");
    expect(getSafeRedirectPath("/admin/bookings")).toBe("/admin/bookings");
    expect(getSafeRedirectPath("/dashboard/settings")).toBe(
      "/dashboard/settings",
    );
  });

  it("rejects absolute, protocol-relative, and malformed redirects", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("//example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("///example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("http://evil.test/phish")).toBe("/dashboard");
    expect(getSafeRedirectPath("\\\\evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    expect(getSafeRedirectPath("/javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects encoded external redirect variants", () => {
    expect(getSafeRedirectPath("%2F%2Fexample.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("%252F%252Fexample.com")).toBe("/dashboard");
    expect(getSafeRedirectPath(encodeURIComponent("https://example.com"))).toBe(
      "/dashboard",
    );
    expect(getSafeRedirectPath("/%09/example.com")).toBe("/dashboard");
  });

  it("falls back for empty or invalid values", () => {
    expect(getSafeRedirectPath("")).toBe("/dashboard");
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
    expect(getSafeRedirectPath(undefined)).toBe("/dashboard");
    expect(getSafeRedirectPath("dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("   ")).toBe("/dashboard");
  });

  it("supports a custom fallback", () => {
    expect(getSafeRedirectPath("//evil", "/admin")).toBe("/admin");
  });
});

describe("resolvePostLoginPath", () => {
  it("preserves safe internal next values including /admin", () => {
    expect(resolvePostLoginPath("/admin")).toBe("/admin");
    expect(resolvePostLoginPath("/dashboard/calendar")).toBe(
      "/dashboard/calendar",
    );
  });

  it("replaces unsafe next values with the default destination", () => {
    expect(resolvePostLoginPath("https://evil.test")).toBe(
      getDefaultPostLoginPath(),
    );
  });
});

describe("validateLoginCredentials", () => {
  it("accepts trimmed email and unaltered password", () => {
    const result = validateLoginCredentials(
      "  owner@business-a.test  ",
      "  Password123!  ",
    );
    expect(result).toEqual({
      ok: true,
      email: "owner@business-a.test",
      password: "  Password123!  ",
    });
  });

  it("rejects an empty email", () => {
    const result = validateLoginCredentials("   ", "secret");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("email");
      expect(result.error).toMatch(/email/i);
    }
  });

  it("rejects an invalid email format", () => {
    const result = validateLoginCredentials("not-an-email", "secret");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("email");
      expect(result.error).toMatch(/valid email/i);
    }
  });

  it("rejects an empty password without composition rules", () => {
    const result = validateLoginCredentials("user@example.com", "");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("password");
      expect(result.error).toMatch(/password/i);
    }
  });

  it("does not reject short but present passwords on login", () => {
    const result = validateLoginCredentials("user@example.com", "ab");
    expect(result).toEqual({
      ok: true,
      email: "user@example.com",
      password: "ab",
    });
  });
});

describe("failed login UX helpers", () => {
  it("increments and resets the client failed-attempt counter", () => {
    expect(incrementFailedAttempts(0)).toBe(1);
    expect(incrementFailedAttempts(2)).toBe(3);
    expect(resetFailedAttempts()).toBe(0);
  });

  it("shows forgot-password only after the threshold when reset exists", () => {
    expect(
      shouldShowForgotPassword(FAILED_ATTEMPTS_BEFORE_RESET_HINT - 1, true),
    ).toBe(false);
    expect(
      shouldShowForgotPassword(FAILED_ATTEMPTS_BEFORE_RESET_HINT, true),
    ).toBe(true);
  });

  it("never shows forgot-password when reset is unavailable", () => {
    expect(PASSWORD_RESET_AVAILABLE).toBe(false);
    expect(shouldShowForgotPassword(3, false)).toBe(false);
    expect(shouldShowForgotPassword(10, false)).toBe(false);
    expect(shouldShowForgotPassword(3)).toBe(false);
  });

  it("keeps auth errors generic without account enumeration", () => {
    expect(GENERIC_AUTH_ERROR).toMatch(/couldn’t sign you in/i);
    expect(GENERIC_AUTH_ERROR.toLowerCase()).not.toMatch(/no account/);
    expect(GENERIC_AUTH_ERROR.toLowerCase()).not.toMatch(/not found/);
    expect(GENERIC_AUTH_ERROR.toLowerCase()).not.toMatch(/incorrect password/);
  });
});
