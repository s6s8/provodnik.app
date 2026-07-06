import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { getDemoUserIdForRole } from "@/data/notifications/demo";
import {
  getDashboardPathForRole,
  resolveCanonicalRole,
} from "@/lib/auth/role-routing";
import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import type { DemoSession } from "@/lib/demo-session";
import { readDemoTravelerProfileFromCookies } from "@/lib/demo-traveler-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";

const MISSING_ROLE_RECOVERY_TO = "/auth?error=missing-role";

type ProfileAuthRow = {
  id: string;
  role: string | null;
  account_status: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

function getCanonicalRedirect(role: AuthContext["role"]): AuthContext["canonicalRedirectTo"] {
  return getDashboardPathForRole(role) as AuthContext["canonicalRedirectTo"];
}

function unauthenticatedContext(hasEnv: boolean): AuthContext {
  return {
    hasSupabaseEnv: hasEnv,
    isAuthenticated: false,
    source: "none",
    role: null,
    accountStatus: null,
    email: null,
    fullName: null,
    avatarUrl: null,
    userId: null,
    canonicalRedirectTo: null,
    missingRoleRecoveryTo: null,
  };
}

async function demoAuthContext(demoSession: DemoSession): Promise<AuthContext> {
  const demoProfile =
    demoSession.role === "traveler"
      ? await readDemoTravelerProfileFromCookies()
      : null;

  return {
    hasSupabaseEnv: false,
    isAuthenticated: true,
    source: "demo",
    role: demoSession.role,
    accountStatus: "active",
    email: null,
    fullName: demoProfile?.full_name?.trim() || null,
    avatarUrl: null,
    userId: getDemoUserIdForRole(demoSession.role),
    canonicalRedirectTo: getCanonicalRedirect(demoSession.role),
    missingRoleRecoveryTo: null,
  };
}

async function readAuthContextFromServerUncached(): Promise<AuthContext> {
  const hasEnv = hasSupabaseEnv();
  const cookieStore = await cookies();

  // Demo cookies apply only when Supabase is not configured (local shell / checklist).
  // When env is present, ignore demo cookies so stale dev cookies cannot spoof role.
  const demoSession = !hasEnv
    ? parseDemoSessionCookieValue(cookieStore.get(DEMO_SESSION_COOKIE)?.value)
    : null;

  if (!hasEnv) {
    if (demoSession) {
      return await demoAuthContext(demoSession);
    }
    return unauthenticatedContext(false);
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: User;

  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return unauthenticatedContext(true);
    }
    user = authUser;
  } catch (error) {
    console.error("[server-auth] auth read failed", error);
    return unauthenticatedContext(true);
  }

  let profile: ProfileAuthRow | null = null;
  let profileError: { message: string } | null = null;

  try {
    const profileResult = await supabase
      .from("profiles")
      .select("id, role, account_status, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileResult.data as ProfileAuthRow | null;
    profileError = profileResult.error as typeof profileError;
  } catch (error) {
    console.error("[server-auth] profile read failed", {
      userId: user.id,
      error,
    });
    profileError = { message: "profile read failed" };
  }

  if (profileError) {
    console.error("[server-auth] profile role read failed", {
      userId: user.id,
      error: profileError.message,
    });

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

  const profileRole = resolveCanonicalRole({
    profileRole: profile?.role,
    appMetadataRole: typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined,
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
    accountStatus: (profile?.account_status as AuthContext["accountStatus"]) ?? "active",
    email: user.email ?? null,
    fullName:
      (profile?.full_name as string | null)?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : null) ||
      null,
    avatarUrl: (profile?.avatar_url as string | null) ?? null,
    userId: user.id,
    canonicalRedirectTo: getCanonicalRedirect(profileRole),
    missingRoleRecoveryTo: null,
  };
}

export const readAuthContextFromServer = cache(readAuthContextFromServerUncached);
