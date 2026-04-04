export type AppRole = "traveler" | "guide" | "admin";

export type AuthSource = "supabase" | "demo" | "none";

export type AuthRedirectTarget =
  | "/traveler/dashboard"
  | "/guide/dashboard"
  | "/admin/dashboard";

export type AuthRecoveryTarget = "/auth?error=missing-role";

export type AuthContext = {
  hasSupabaseEnv: boolean;
  isAuthenticated: boolean;
  source: AuthSource;
  role: AppRole | null;
  email: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  missingRoleRecoveryTo?: AuthRecoveryTarget | null;
};

