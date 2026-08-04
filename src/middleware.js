import { NextResponse } from "next/server";

/**
 * Route Protection Middleware
 *
 * Rules:
 *  - /admin/login  → public (always accessible)
 *  - /admin/*      → requires `adminToken` cookie → redirects to /admin/login
 *  - /user/login   → public (always accessible)
 *  - /user/*       → requires `userToken` cookie  → redirects to /user/login
 *  - /             → public (root already redirects to /admin/login via page.js)
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ─── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Allow the login page without a token
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      // If already logged-in admin tries to visit login page, redirect to dashboard
      const adminToken = request.cookies.get("adminToken")?.value;
      if (adminToken) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // All other /admin/* routes require adminToken
    const adminToken = request.cookies.get("adminToken")?.value;
    if (!adminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      // Preserve the attempted URL so we can redirect back after login (optional)
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ─── User routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/user")) {
    // Allow the login page without a token
    if (pathname === "/user/login" || pathname.startsWith("/user/login/")) {
      // If already logged-in user tries to visit login page, redirect to dashboard
      const userToken = request.cookies.get("userToken")?.value;
      if (userToken) {
        return NextResponse.redirect(new URL("/user/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // All other /user/* routes require userToken
    const userToken = request.cookies.get("userToken")?.value;
    if (!userToken) {
      const loginUrl = new URL("/user/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // All other routes (e.g. /, _next, api) pass through
  return NextResponse.next();
}

/**
 * Matcher config — run middleware only on relevant routes.
 * Excludes _next internals, static files, and public assets.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, site icons, images, fonts
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)).*)",
  ],
};
