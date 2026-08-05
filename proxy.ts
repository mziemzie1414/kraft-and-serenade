import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth-cookies";

/**
 * Bounces anonymous browsers away from `/admin` before the page renders.
 *
 * This is an optimistic check on purpose: it only looks for the cookie, never
 * validates it, because that would mean a database round trip on every request.
 * The real check is `requireAdmin()` in `lib/auth.ts`, called by the admin layout
 * and by every admin Server Action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has(ADMIN_COOKIE)) {
    const login = new URL("/admin/login", request.url);
    // Come back to whatever was being opened once signed in.
    login.searchParams.set("next", pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
