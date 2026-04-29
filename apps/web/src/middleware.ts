import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/reset-password", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  
  // Better-auth uses this cookie name by default
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!isPublic && !sessionToken) {
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
