import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, CUSTOMER_COOKIE } from "@/lib/auth-cookies";

/**
 * Bounces anonymous browsers away from the two signed-in areas before the page
 * renders: `/admin` and `/account`.
 *
 * These are optimistic checks on purpose. They only look for a cookie, never
 * validate it, because that would mean a database round trip on every request and
 * `proxy` cannot import Prisma. The real checks are `requireAdmin()` and
 * `requireCustomer()`, called by the respective layouts and by every Server
 * Action behind them.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guard(request, {
      pathname,
      cookieName: ADMIN_COOKIE,
      loginPath: "/admin/login",
      // Sharing the panel layout is what the login page must not do; letting it
      // through here is what stops it redirecting to itself.
      publicPaths: ["/admin/login"],
    });
  }

  return guard(request, {
    pathname,
    cookieName: CUSTOMER_COOKIE,
    loginPath: "/account/login",
    // Both are for people who by definition have no session yet.
    publicPaths: ["/account/login", "/account/register"],
  });
}

function guard(
  request: NextRequest,
  options: {
    pathname: string;
    cookieName: string;
    loginPath: string;
    publicPaths: string[];
  },
) {
  if (options.publicPaths.includes(options.pathname)) return NextResponse.next();

  if (!request.cookies.has(options.cookieName)) {
    const login = new URL(options.loginPath, request.url);
    // Come back to whatever was being opened once signed in.
    login.searchParams.set("next", options.pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"],
};
