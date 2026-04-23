export type AppRole = "traveler" | "guide" | "admin";

export type AuthSource = "supabase" | "demo" | "none";

export type AuthRedirectTarget =
  | "/traveler/requests"
  | "/guide"
  | "/admin/dashboard";

export type AuthRecoveryTarget = "/auth?error=missing-role";

export type AuthContext = {
  hasSupabaseEnv: boolean;
  isAuthenticated: boolean;
  source: AuthSource;
  role: AppRole | null;
  email: string | null;
  /** Supabase auth user id when session exists; null for demo / anonymous. */
  userId: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  missingRoleRecoveryTo?: AuthRecoveryTarget | null;
};

