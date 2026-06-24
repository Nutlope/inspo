/**
 * Next.js 16 "proxy" (renamed from middleware). Optimistic auth gate -
 * checks for the Better Auth cookie's existence and bounces unsigned
 * users to /signin. The hard authz check still happens in the page
 * itself via `requireUser` / `requireRole`.
 */

import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Better Auth sets these cookie names by default.
  const hasSession =
    req.cookies.has("better-auth.session_token") ||
    req.cookies.has("__Secure-better-auth.session_token");

  if (!hasSession) {
    // /signin is gone; bounce admin probers home.
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
