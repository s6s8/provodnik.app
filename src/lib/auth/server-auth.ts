import { cookies } from "next/headers";

import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_SESSION_COOKIE, parseDemoSessionCookieValue } from "@/lib/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, AuthContext } from "@/lib/auth/types";

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
  };

  if (!hasEnv) {
    return baseContext;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return baseContext;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  const profileRole =
    profile?.role === "traveler" ||
    profile?.role === "guide" ||
    profile?.role === "admin"
      ? (profile.role as AppRole)
      : null;

  return {
    hasSupabaseEnv: hasEnv,
    isAuthenticated: true,
    source: "supabase",
    role: profileRole ?? baseContext.role,
    email: session.user.email ?? null,
  };
}

