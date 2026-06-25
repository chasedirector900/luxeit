import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware to Proxy. Fast first pass: redirect when there's
// NO session cookie at all. A present-but-stale cookie still reaches the page,
// where the server-side gate (lib/auth/server.ts → requireUser) validates it
// against Django and redirects if it's invalid. Real authz is on the backend.
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
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Has a cookie — let it through, but pass the path so the server gate can
  // build an accurate ?next= if the session turns out to be invalid.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/account", "/account/:path*", "/cart/checkout", "/cart/checkout/:path*"],
};
