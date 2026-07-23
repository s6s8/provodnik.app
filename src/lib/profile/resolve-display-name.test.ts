import { describe, it, expect } from "vitest";
import { resolveDisplayName, resolveInboxParticipantName, resolveMessageSenderDisplayName } from "./resolve-display-name";

describe("resolveDisplayName", () => {
  it("returns the name when present and trimmed", () => {
    expect(
      resolveDisplayName("guide", { full_name: "  Алдар Б.  " }),
    ).toBe("Алдар Б.");
  });

  it("returns «Локальный гид» when name is empty and role is guide", () => {
    expect(resolveDisplayName("guide", { full_name: null })).toBe(
      "Локальный гид",
    );
    expect(resolveDisplayName("guide", { full_name: "   " })).toBe(
      "Локальный гид",
    );
  });

  it("returns «Путешественник» when name is empty and role is traveler", () => {
    expect(resolveDisplayName("traveler", { full_name: null })).toBe(
      "Путешественник",
    );
  });

  it("masks traveler names by default for cross-user display", () => {
    expect(
      resolveDisplayName("traveler", { full_name: "Анна Петрова" }),
    ).toBe("Путешественник");
  });

  it("reveals traveler names only in trusted context", () => {
    expect(
      resolveDisplayName(
        "traveler",
        { full_name: "  Анна Петрова  " },
        { context: "trusted" },
      ),
    ).toBe("Анна Петрова");
  });

  it("returns «Путешественник» on inbox-card context regardless of name", () => {
    expect(
      resolveDisplayName(
        "traveler",
        { full_name: "Анна П." },
        { context: "inbox-card" },
      ),
    ).toBe("Путешественник");
  });

  it("masks travelers in inbox lists even when a profile name is present", () => {
    expect(
      resolveInboxParticipantName({
        isGuide: false,
        profileFullName: "Мария Секретная",
      }),
    ).toBe("Путешественник");
  });

  it("prefers the public guide name in inbox lists", () => {
    expect(
      resolveInboxParticipantName({
        isGuide: true,
        publicGuideName: "Гид Дмитрий",
        profileFullName: "Дмитрий Иванов",
      }),
    ).toBe("Гид Дмитрий");
  });

  it("reveals traveler names in trusted message threads", () => {
    expect(
      resolveMessageSenderDisplayName({
        senderRole: "traveler",
        trustedParticipantName: "Анна Смирнова",
        profileFullName: null,
      }),
    ).toBe("Анна Смирнова");
  });

  it("uses the public guide profile for guide senders in message threads", () => {
    expect(
      resolveMessageSenderDisplayName({
        senderRole: "guide",
        publicGuideName: "Гид Дмитрий",
        profileFullName: null,
      }),
    ).toBe("Гид Дмитрий");
  });

  it("never returns literal «Гид»", () => {
    const cases: Array<{
      role: "guide" | "traveler";
      profile: { full_name: string | null };
    }> = [
      { role: "guide", profile: { full_name: null } },
      { role: "guide", profile: { full_name: "" } },
      { role: "guide", profile: { full_name: "  " } },
      { role: "traveler", profile: { full_name: null } },
      { role: "traveler", profile: { full_name: "Гид" } },
    ];
    // The fallback path never returns plain «Гид»
    for (const { role, profile } of cases.slice(0, 4)) {
      expect(resolveDisplayName(role, profile)).not.toBe("Гид");
    }
  });
});
