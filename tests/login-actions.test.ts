import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((path: string) => {
  const error = new Error(`NEXT_REDIRECT:${path}`);
  (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;${path}`;
  throw error;
});

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
const getUserMock = vi.fn();
const profileMaybeSingleMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      getUser: getUserMock,
    },
    from: (table: string) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: profileMaybeSingleMock,
          }),
        }),
      };
    },
  }),
}));

import { signIn, signOut } from "@/lib/auth/actions";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/login-validation";

function formDataFrom(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("signIn server action", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    getUserMock.mockReset();
    profileMaybeSingleMock.mockReset();

    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "owner@business-a.test" } },
    });
    profileMaybeSingleMock.mockResolvedValue({
      data: { platform_role: null },
    });
  });

  it("redirects clients to a safe internal next path on success", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(
      signIn(
        { error: null },
        formDataFrom({
          email: "owner@business-a.test",
          password: "Password123!",
          next: "/dashboard",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "owner@business-a.test",
      password: "Password123!",
    });
  });

  it("preserves /admin as next so server-side admin checks can run", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(
      signIn(
        { error: null },
        formDataFrom({
          email: "admin@meridian.test",
          password: "Password123!",
          next: "/admin",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin/);
  });

  it("sends Meridian admins to /admin when next is the client home", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@meridian.test" } },
    });
    profileMaybeSingleMock.mockResolvedValue({
      data: { platform_role: "meridian_admin" },
    });

    await expect(
      signIn(
        { error: null },
        formDataFrom({
          email: "admin@meridian.test",
          password: "Password123!",
          next: "/dashboard",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin/);
  });

  it("rejects external next values and uses the default destination", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(
      signIn(
        { error: null },
        formDataFrom({
          email: "owner@business-a.test",
          password: "Password123!",
          next: "https://evil.example",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/dashboard/);
  });

  it("returns a generic error for invalid credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const result = await signIn(
      { error: null },
      formDataFrom({
        email: "owner@business-a.test",
        password: "bad-password",
        next: "/dashboard",
      }),
    );

    expect(result).toEqual({ error: GENERIC_AUTH_ERROR, field: "form" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("validates empty credentials without calling Supabase", async () => {
    const result = await signIn(
      { error: null },
      formDataFrom({
        email: "",
        password: "",
        next: "/dashboard",
      }),
    );

    expect(result.field).toBe("email");
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("trims email but never alters password values", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(
      signIn(
        { error: null },
        formDataFrom({
          email: "  owner@business-a.test  ",
          password: "  spaced-password  ",
          next: "/dashboard",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "owner@business-a.test",
      password: "  spaced-password  ",
    });
  });
});

describe("signOut server action", () => {
  it("signs out and returns to the shared login route", async () => {
    signOutMock.mockResolvedValue({});

    await expect(signOut()).rejects.toThrow(/NEXT_REDIRECT:\/login/);
    expect(signOutMock).toHaveBeenCalled();
  });
});
