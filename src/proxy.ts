import { NextResponse, type NextRequest } from "next/server";

import {
  getDashboardPathForRole,
  getRequiredRoleForPathname,
  resolveCanonicalRole,
  roleHasAccess,
} from "@/lib/auth/role-routing";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import type { AppRole } from "@/lib/auth/types";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function redirectToAuth(request: NextRequest) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return redirectTo(request, buildAuthLoginRedirect(nextPath));
}

function getDemoRoleFromRequest(request: NextRequest) {
  const cookieValue = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  return parseDemoSessionCookieValue(cookieValue)?.role ?? null;
}

function continueWithRefreshedSession(
  request: NextRequest,
  applyCookies: (response: NextResponse) => NextResponse,
) {
  return applyCookies(
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
  );
}

export async function proxy(request: NextRequest) {
  const requiredRole = getRequiredRoleForPathname(request.nextUrl.pathname);

  if (!hasSupabaseEnv()) {
    if (!requiredRole) {
      return NextResponse.next();
    }

    const demoRole = getDemoRoleFromRequest(request);

    if (!demoRole) {
      return redirectToAuth(request);
    }

    if (demoRole !== requiredRole) {
      // Admin layout renders an on-screen access error for non-admin sessions.
      if (requiredRole === "admin") {
        return NextResponse.next();
      }
      return redirectTo(request, getDashboardPathForRole(demoRole) ?? "/auth");
    }

    return NextResponse.next();
  }

  const { supabase, applyCookies } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!requiredRole) {
    return continueWithRefreshedSession(request, applyCookies);
  }

  if (!user) {
    return applyCookies(redirectToAuth(request));
  }

  // Role lookup matches server-auth.ts: profiles.role is canonical.
  // JWT app_metadata.role is a signup cache and may be stale when profile.role
  // was updated without refreshing the claim (see AP-038).
  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return applyCookies(redirectTo(request, "/auth?error=missing-role"));
  }

  const role: AppRole | null = resolveCanonicalRole({
    profileRole: profile?.role,
    appMetadataRole: user.app_metadata?.role as string | undefined,
    userMetadataRole: user.user_metadata?.role as string | undefined,
  });

  if (!role) {
    return applyCookies(redirectTo(request, "/auth?error=missing-role"));
  }

  if (!roleHasAccess(role, requiredRole)) {
    // Admin layout renders an on-screen access error for non-admin sessions.
    if (requiredRole === "admin") {
      return continueWithRefreshedSession(request, applyCookies);
    }
    return applyCookies(
      redirectTo(request, getDashboardPathForRole(role) ?? "/auth?error=missing-role"),
    );
  }

  return continueWithRefreshedSession(request, applyCookies);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
