import { NextResponse, type NextRequest } from "next/server";

import {
  getDashboardPathForRole,
  getRequiredRoleForPathname,
  isAppRole,
  roleHasAccess,
} from "@/lib/auth/role-routing";
import type { AppRole } from "@/lib/auth/types";
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

  // Role lookup matches server-auth.ts (the SSR side): JWT app_metadata.role
  // is the fast path stamped by signUpAction, profiles.role is the canonical
  // source for any user created outside that path. Without the fallback the
  // proxy and the auth page disagreed — proxy bounced JWT-no-role users to
  // /auth?error=missing-role, auth page read profile.role and bounced them
  // back to their dashboard — infinite redirect loop. Cost: one DB query
  // per protected route for users without the JWT claim; canonical
  // signUpAction users still hit the synchronous JWT path.
  let role: AppRole | null = isAppRole(session.user.app_metadata?.role)
    ? (session.user.app_metadata.role as AppRole)
    : null;

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    if (isAppRole(profile?.role)) {
      role = profile.role;
    }
  }

  if (!role) {
    return applyCookies(redirectTo(request, "/auth?error=missing-role"));
  }

  if (!roleHasAccess(role, requiredRole)) {
    return applyCookies(
      redirectTo(request, getDashboardPathForRole(role) ?? "/auth?error=missing-role"),
    );
  }

  return applyCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/traveler/:path*",
    "/guide/:path*",
    "/admin/:path*",
    "/profile/guide/:path*",
  ],
};
