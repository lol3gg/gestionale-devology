import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isHomeRoute = pathname === "/";

  // Home e login: se già autenticato, vai dritto alla dashboard.
  if ((isHomeRoute || isLoginRoute) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Home senza sessione: accesso admin (login).
  if (isHomeRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
