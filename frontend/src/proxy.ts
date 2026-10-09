import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Chequeo optimista: sin sesión se va al login, y cada rol queda en su sección.
 * La autorización real la hace Laravel en cada endpoint.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("timbre_token")?.value;
  const role = request.cookies.get("timbre_role")?.value;
  const { pathname } = request.nextUrl;
  const home = role === "inquilino" ? "/portal" : "/admin";

  if (pathname === "/" || pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return pathname === "/" ? NextResponse.redirect(new URL("/login", request.url)) : NextResponse.next();
  }

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  if (pathname.startsWith("/portal") && role !== "inquilino") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/portal/:path*", "/recibo/:path*"],
};
