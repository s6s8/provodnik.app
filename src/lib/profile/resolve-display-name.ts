export type ResolveRole = "guide" | "traveler";
export type ResolveProfile = { full_name?: string | null };
export type ResolveContext = "inbox-card" | "trusted";
export type ConversationSenderRole = "guide" | "traveler" | "admin" | "system";

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

/** Inbox thread list: guides use the public name; travelers are always masked. */
export function resolveInboxParticipantName(input: {
  isGuide: boolean;
  publicGuideName?: string | null;
  profileFullName?: string | null;
}): string {
  if (input.isGuide) {
    return resolveDisplayName("guide", {
      full_name: input.publicGuideName ?? input.profileFullName,
    });
  }

  return resolveDisplayName(
    "traveler",
    { full_name: input.profileFullName },
    { context: "inbox-card" },
  );
}

/** Message thread: trusted participant names; guides use the public profile view. */
export function resolveMessageSenderDisplayName(input: {
  senderRole: ConversationSenderRole;
  publicGuideName?: string | null;
  trustedParticipantName?: string | null;
  profileFullName?: string | null;
}): string {
  if (input.senderRole === "system") return "Система";
  if (input.senderRole === "admin") {
    const name = input.profileFullName?.trim();
    return name || "Администратор";
  }
  if (input.senderRole === "guide") {
    return resolveDisplayName("guide", {
      full_name: input.publicGuideName ?? input.profileFullName,
    });
  }

  return resolveDisplayName(
    "traveler",
    { full_name: input.trustedParticipantName ?? input.profileFullName },
    { context: "trusted" },
  );
}
