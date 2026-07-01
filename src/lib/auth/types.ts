export type AppRole = "traveler" | "guide" | "admin";

export type AuthSource = "supabase" | "demo" | "none";

export type AuthRedirectTarget =
  | "/trips"
  | "/guide"
  | "/admin/dashboard";

export type AuthRecoveryTarget = "/auth?error=missing-role";

export type AuthContext = {
  hasSupabaseEnv: boolean;
  isAuthenticated: boolean;
  source: AuthSource;
  role: AppRole | null;
  accountStatus?: "active" | "suspended" | "archived" | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  /** Supabase auth user id when session exists; null for demo / anonymous. */
  userId: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  missingRoleRecoveryTo?: AuthRecoveryTarget | null;
};

