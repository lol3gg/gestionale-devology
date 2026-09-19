import { NextResponse, type NextRequest } from "next/server";
import { isAuthFresh, readAuthFromCookies } from "@/lib/auth/cookieSession";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isHomeRoute = pathname === "/";
  const cookieAuth = readAuthFromCookies(request.cookies.getAll());

  // Sessione ancora valida: niente chiamata a Supabase, cambio pagina immediato.
  if (isAuthFresh(cookieAuth)) {
    if (isHomeRoute || isLoginRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if ((isHomeRoute || isLoginRoute) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isHomeRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/dashboard/:path*"],
};
