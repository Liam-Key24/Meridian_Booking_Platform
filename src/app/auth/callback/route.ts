import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { UPDATE_PASSWORD_HREF } from "@/lib/auth/password-reset";

/**
 * Supabase Auth email callback (PKCE). Exchanges `code` for a session, then
 * redirects to a safe in-app path (password update or post-login destination).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeRedirectPath(
    url.searchParams.get("next") ?? UPDATE_PASSWORD_HREF,
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] callback exchange failed", error.message);
      const login = new URL("/login", url.origin);
      login.searchParams.set("error", "reset_link");
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
