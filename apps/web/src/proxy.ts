import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/reset-password", "/api/auth"];
// Requires login but must not be redirected away even when logged in
const SETUP_PATHS = ["/onboarding", "/join"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isSetup = SETUP_PATHS.some(p => pathname.startsWith(p));
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!isPublic && !isSetup && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isSetup && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/") {
    if (sessionToken) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPublic && sessionToken && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};
