import { NextResponse, type NextRequest } from "next/server";

import {
  getDashboardPathForRole,
  getRequiredRoleForPathname,
  isAppRole,
} from "@/lib/auth/role-routing";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function getDemoRoleFromRequest(request: NextRequest) {
  const cookieValue = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  return parseDemoSessionCookieValue(cookieValue)?.role ?? null;
}

export async function proxy(request: NextRequest) {
  const requiredRole = getRequiredRoleForPathname(request.nextUrl.pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!hasSupabaseEnv()) {
    const demoRole = getDemoRoleFromRequest(request);

    if (!demoRole) {
      return redirectTo(request, "/auth");
    }

    if (demoRole !== requiredRole) {
      return redirectTo(request, getDashboardPathForRole(demoRole) ?? "/auth");
    }

    return NextResponse.next();
  }

  const { supabase, applyCookies } = createSupabaseMiddlewareClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return applyCookies(redirectTo(request, "/auth"));
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()) as { data: { role: string | null } | null };

  const role = isAppRole(profile?.role) ? profile.role : null;

  if (!role) {
    return applyCookies(redirectTo(request, "/auth?error=missing-role"));
  }

  if (role !== requiredRole) {
    return applyCookies(
      redirectTo(request, getDashboardPathForRole(role) ?? "/auth?error=missing-role"),
    );
  }

  return applyCookies(NextResponse.next());
}

export const config = {
  matcher: ["/traveler/:path*", "/guide/:path*", "/admin/:path*"],
};
