import { cookies } from "next/headers";

import {
  getDashboardPathForRole,
  resolveCanonicalRole,
} from "@/lib/auth/role-routing";
import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";

const MISSING_ROLE_RECOVERY_TO = "/auth?error=missing-role";

function getCanonicalRedirect(role: AuthContext["role"]): AuthContext["canonicalRedirectTo"] {
  return getDashboardPathForRole(role) as AuthContext["canonicalRedirectTo"];
}

export async function readAuthContextFromServer(): Promise<AuthContext> {
  const hasEnv = hasSupabaseEnv();
  const cookieStore = await cookies();

  const demoCookie = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  const demoSession = parseDemoSessionCookieValue(demoCookie);

  const baseContext: AuthContext = {
    hasSupabaseEnv: hasEnv,
    isAuthenticated: false,
    source: demoSession ? "demo" : "none",
    role: demoSession?.role ?? null,
    email: null,
    fullName: null,
    avatarUrl: null,
    userId: null,
    canonicalRedirectTo: getCanonicalRedirect(demoSession?.role ?? null),
    missingRoleRecoveryTo: null,
  };

  if (!hasEnv) {
    return baseContext;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return baseContext;
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

