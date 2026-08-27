import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePostLoginDestination } from "@/lib/auth/safe-redirect";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (
      PROTECTED_PREFIXES.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
      )
    ) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/login/forgot-password") &&
    user
  ) {
    const [{ data: profile }, { count: membershipCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("platform_role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("business_memberships")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

    const destination = resolvePostLoginDestination({
      next: request.nextUrl.searchParams.get("next"),
      isMeridianAdmin: profile?.platform_role === "meridian_admin",
      hasBusinessMembership: (membershipCount ?? 0) > 0,
    });
    return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
  }

  if (
    request.nextUrl.pathname === "/login/update-password" &&
    !user
  ) {
    return NextResponse.redirect(
      new URL("/login/forgot-password", request.nextUrl.origin),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/login/:path*",
  ],
};
