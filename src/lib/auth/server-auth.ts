import { cookies } from "next/headers";

import { getDemoUserIdForRole } from "@/data/notifications/demo";
import {
  getDashboardPathForRole,
  resolveCanonicalRole,
} from "@/lib/auth/role-routing";
import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import type { DemoSession } from "@/lib/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";

const MISSING_ROLE_RECOVERY_TO = "/auth?error=missing-role";

function getCanonicalRedirect(role: AuthContext["role"]): AuthContext["canonicalRedirectTo"] {
  return getDashboardPathForRole(role) as AuthContext["canonicalRedirectTo"];
}

function unauthenticatedContext(hasEnv: boolean): AuthContext {
  return {
    hasSupabaseEnv: hasEnv,
    isAuthenticated: false,
    source: "none",
    role: null,
    email: null,
    fullName: null,
    avatarUrl: null,
    userId: null,
    canonicalRedirectTo: null,
    missingRoleRecoveryTo: null,
  };
}

function demoAuthContext(demoSession: DemoSession): AuthContext {
  return {
    hasSupabaseEnv: false,
    isAuthenticated: true,
    source: "demo",
    role: demoSession.role,
    email: null,
    fullName: null,
    avatarUrl: null,
    userId: getDemoUserIdForRole(demoSession.role),
    canonicalRedirectTo: getCanonicalRedirect(demoSession.role),
    missingRoleRecoveryTo: null,
  };
}

export async function readAuthContextFromServer(): Promise<AuthContext> {
  const hasEnv = hasSupabaseEnv();
  const cookieStore = await cookies();

  // Demo cookies apply only when Supabase is not configured (local shell / checklist).
  // When env is present, ignore demo cookies so stale dev cookies cannot spoof role.
  const demoSession = !hasEnv
    ? parseDemoSessionCookieValue(cookieStore.get(DEMO_SESSION_COOKIE)?.value)
    : null;

  if (!hasEnv) {
    if (demoSession) {
      return demoAuthContext(demoSession);
    }
    return unauthenticatedContext(false);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return unauthenticatedContext(true);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const profileRole = resolveCanonicalRole({
    profileRole: profile?.role,
    appMetadataRole: user.app_metadata?.role as string | undefined,
    userMetadataRole: user.user_metadata?.role as string | undefined,
  });

  if (!profileRole) {
    return {
      hasSupabaseEnv: hasEnv,
      isAuthenticated: true,
      source: "supabase",
      role: null,
      email: user.email ?? null,
      fullName: null,
      avatarUrl: null,
      userId: user.id,
      canonicalRedirectTo: null,
      missingRoleRecoveryTo: MISSING_ROLE_RECOVERY_TO,
    };
  }

  return {
    hasSupabaseEnv: hasEnv,
    isAuthenticated: true,
    source: "supabase",
    role: profileRole,
    email: user.email ?? null,
    fullName: (profile?.full_name as string | null) ?? null,
    avatarUrl: (profile?.avatar_url as string | null) ?? null,
    userId: user.id,
    canonicalRedirectTo: getCanonicalRedirect(profileRole),
    missingRoleRecoveryTo: null,
  };
}
