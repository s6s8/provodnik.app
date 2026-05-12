import { describe, it, expect } from "vitest";
import { maskMessageBodies, maskPii, hasPii } from "./mask";

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

describe("hasPii", () => {
  it("detects phone", () => expect(hasPii("+79161234567")).toBe(true));
  it("detects email", () => expect(hasPii("x@y.ru")).toBe(true));
  it("detects telegram", () => expect(hasPii("@myhandle")).toBe(true));
  it("returns false for clean text", () =>
    expect(hasPii("Экскурсия по Москве 3 часа")).toBe(false));
  it("returns false for null", () => expect(hasPii(null)).toBe(false));
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

  it("preserves non-body fields verbatim via spread (same nested references)", () => {
    const sender_profile = { full_name: "Мария" };
    const metadata = { x: 1 };
    const row = {
      id: "00000000-0000-4000-8000-000000000002",
      thread_id: "00000000-0000-4000-8000-000000000003",
      sender_id: "00000000-0000-4000-8000-000000000004",
      sender_role: "guide" as const,
      body: "+7 999 1234567",
      metadata,
      created_at: "2025-01-16T08:30:00.000Z",
      sender_profile,
    };
    const [out] = maskMessageBodies([row]);
    expect(out.id).toBe(row.id);
    expect(out.thread_id).toBe(row.thread_id);
    expect(out.sender_id).toBe(row.sender_id);
    expect(out.sender_role).toBe(row.sender_role);
    expect(out.created_at).toBe(row.created_at);
    expect(out.metadata).toBe(metadata);
    expect(out.sender_profile).toBe(sender_profile);
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
