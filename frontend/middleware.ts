/**
 * Next.js Edge Middleware — route protection.
 *
 * Protected routes redirect to /login when no JWT is present.
 * /login and /register are public; /login redirects to /dashboard if already authed.
 */

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

// Routes that require auth
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/upload",
  "/notes",
  "/exam-intelligence",
  "/voice",
  "/settings",
  "/profile",
];

function getTokenFromRequest(req: NextRequest): string | null {
  // The Zustand persisted store key is "academic_ai_token"
  // zustand/middleware persist serialises to: { state: { token: "...", user: {...} } }
  const raw = req.cookies.get("academic_ai_token")?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/health") ||
    pathname.startsWith("/audio") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Already logged in → redirect away from auth pages
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Not logged in → redirect protected pages to login
  if (!token && (isProtected || pathname === "/")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
