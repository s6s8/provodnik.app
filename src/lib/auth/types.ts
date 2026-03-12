export type AppRole = "traveler" | "guide" | "admin";

export type AuthSource = "supabase" | "demo" | "none";

export type AuthContext = {
  hasSupabaseEnv: boolean;
  isAuthenticated: boolean;
  source: AuthSource;
  role: AppRole | null;
  email: string | null;
};

