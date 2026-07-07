import { describe, it, expect } from "vitest";
import { maskMessageBodies, maskPii } from "./mask";

const HIDDEN = "[контакт скрыт]";

describe("maskPii — Russian phone numbers", () => {
  it("masks +7 with spaces and dashes", () =>
    expect(maskPii("Звоните +7 (916) 123-45-67")).toContain(HIDDEN));
  it("masks 8 with parentheses", () =>
    expect(maskPii("тел 8(495)9876543")).toContain(HIDDEN));
  it("masks +7XXXXXXXXXX compact", () =>
    expect(maskPii("мой номер +79161234567")).toContain(HIDDEN));
  it("masks 8XXXXXXXXXX compact", () =>
    expect(maskPii("звоните 89161234567")).toContain(HIDDEN));
  it("masks standalone 9XX XXX XX XX", () =>
    expect(maskPii("903 456 78 90")).toContain(HIDDEN));
  it("masks phone with dots", () =>
    expect(maskPii("+7.916.123.45.67")).toContain(HIDDEN));
});

describe("maskPii — email", () => {
  it("masks plain email", () =>
    expect(maskPii("напишите мне: guide@example.com пожалуйста")).toContain(HIDDEN));
  it("masks email with + alias", () =>
    expect(maskPii("guide+tours@yandex.ru")).toContain(HIDDEN));
  it("masks email mid-sentence", () =>
    expect(maskPii("Пишите на test123@mail.ru или звоните")).toContain(HIDDEN));
});

describe("maskPii — Telegram", () => {
  it("masks @handle", () =>
    expect(maskPii("Telegram: @dmitriy_guide")).toContain(HIDDEN));
  it("masks t.me link", () =>
    expect(maskPii("t.me/myguide")).toContain(HIDDEN));
  it("masks https://t.me link", () =>
    expect(maskPii("https://t.me/dmitriy_guide")).toContain(HIDDEN));
});

describe("maskPii — WhatsApp", () => {
  it("masks wa.me link", () =>
    expect(maskPii("wa.me/+79161234567")).toContain(HIDDEN));
  it("masks whatsapp.com link", () =>
    expect(maskPii("https://www.whatsapp.com/invite/abc")).toContain(HIDDEN));
});

describe("maskPii — VK", () => {
  it("masks vk.com link", () =>
    expect(maskPii("vk.com/dmitriy_guide")).toContain(HIDDEN));
  it("masks vkontakte.ru link", () =>
    expect(maskPii("https://vkontakte.ru/id12345")).toContain(HIDDEN));
});

describe("maskPii — edge cases", () => {
  it("returns empty string for null", () =>
    expect(maskPii(null)).toBe(""));
  it("returns empty string for undefined", () =>
    expect(maskPii(undefined)).toBe(""));
  it("returns empty string for empty string", () =>
    expect(maskPii("")).toBe(""));
  it("does not alter clean text", () =>
    expect(maskPii("Добро пожаловать в Алтай!")).toBe("Добро пожаловать в Алтай!"));
  it("masks multiple PII in one string", () => {
    const result = maskPii("Звоните +79161234567 или пишите guide@ya.ru");
    expect(result.split(HIDDEN).length).toBe(3); // two replacements → 3 parts
  });
});

describe("maskMessageBodies", () => {
  it("replaces phone in body with maskPii(phone), not a hardcoded literal", () => {
    const phone = "+7 999 1234567";
    const row = {
      id: "00000000-0000-4000-8000-000000000001",
      body: `Позвоните ${phone}`,
      created_at: "2025-01-15T12:00:00.000Z",
      metadata: { k: "v" },
      sender_profile: { full_name: "Иван" },
    };
    const [out] = maskMessageBodies([row]);
    expect(out.body).toBe(`Позвоните ${maskPii(phone)}`);
    expect(out.body).toContain(maskPii(phone));
  });

  it("returns only the whitelisted message shape", () => {
    const row = {
      id: "00000000-0000-4000-8000-000000000002",
      thread_id: "00000000-0000-4000-8000-000000000003",
      sender_id: "00000000-0000-4000-8000-000000000004",
      sender_role: "guide" as const,
      body: "+7 999 1234567",
      metadata: { contact: "+79991234567" },
      created_at: "2025-01-16T08:30:00.000Z",
      sender_profile: { full_name: "Мария", email: "maria@example.com" },
      internal_notes: "call +79991234567",
    };
    const [out] = maskMessageBodies([row]);
    expect(out).toEqual({
      id: row.id,
      thread_id: row.thread_id,
      sender_id: row.sender_id,
      sender_role: row.sender_role,
      body: HIDDEN,
      created_at: row.created_at,
      sender_display_name: null,
    });
  });

  it("preserves a resolved sender_display_name through the whitelist", () => {
    const row = {
      id: "00000000-0000-4000-8000-000000000006",
      thread_id: "00000000-0000-4000-8000-000000000007",
      sender_id: "00000000-0000-4000-8000-000000000008",
      sender_role: "guide" as const,
      body: "Здравствуйте!",
      metadata: {},
      created_at: "2025-01-18T08:30:00.000Z",
      sender_profile: null as null,
      sender_display_name: "Гид Дмитрий",
    };
    const [out] = maskMessageBodies([row]);
    expect(out).toMatchObject({ sender_display_name: "Гид Дмитрий" });
    expect(out).not.toHaveProperty("sender_profile");
  });

  it("round-trips an empty array", () => {
    expect(maskMessageBodies([])).toEqual([]);
  });

  it("leaves a row with clean body unchanged", () => {
    const clean = "Только текст без контактов.";
    const row = {
      id: "00000000-0000-4000-8000-000000000005",
      body: clean,
      created_at: "2025-01-17T00:00:00.000Z",
      metadata: {},
      sender_profile: null as null,
    };
    const [out] = maskMessageBodies([row]);
    expect(out.body).toBe(clean);
  });
});
