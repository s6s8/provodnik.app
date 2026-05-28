export type ResolveRole = "guide" | "traveler";
export type ResolveProfile = { full_name?: string | null };
export type ResolveContext = "inbox-card";

export function resolveDisplayName(
  role: ResolveRole,
  profile: ResolveProfile,
  options?: { context?: ResolveContext },
): string {
  // Privacy masking: inbox card always shows generic «Путешественник»
  if (options?.context === "inbox-card" && role === "traveler") {
    return "Путешественник";
  }

  const name = profile.full_name?.trim() ?? "";
  if (name) return name;
  return role === "guide" ? "Локальный гид" : "Путешественник";
}
