import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware to Proxy. This is an OPTIMISTIC auth guard:
// it redirects unauthenticated visitors away from protected pages for good UX.
// Real authorization MUST be enforced by the Django backend on every request.
const SESSION_COOKIE = "luxeit_session";

const PROTECTED_PREFIXES = ["/account", "/cart/checkout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account", "/account/:path*", "/cart/checkout", "/cart/checkout/:path*"],
};
