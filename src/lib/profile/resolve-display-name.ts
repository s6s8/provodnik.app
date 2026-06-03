export type ResolveRole = "guide" | "traveler";
export type ResolveProfile = { full_name?: string | null };
export type ResolveContext = "inbox-card" | "trusted";

export function resolveDisplayName(
  role: ResolveRole,
  profile: ResolveProfile,
  options?: { context?: ResolveContext },
): string {
  if (role === "traveler" && options?.context !== "trusted") {
    return "Путешественник";
  }

  const name = profile.full_name?.trim() ?? "";
  if (name) return name;
  return role === "guide" ? "Локальный гид" : "Путешественник";
}
