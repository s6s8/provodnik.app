import { describe, expect, it } from "vitest";

import { mergeRealtimeMessage } from "@/features/messaging/hooks/use-realtime-messages";
import type { MessageWithSender } from "@/lib/supabase/conversations";
import type { MessageRow } from "@/lib/supabase/types";

function makeRow(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: "msg-1",
    thread_id: "thread-1",
    sender_id: "user-1",
    sender_role: "traveler",
    body: "hello",
    metadata: null,
    created_at: "2026-07-05T00:00:00Z",
    ...overrides,
  };
}

describe("mergeRealtimeMessage (PRD-003)", () => {
  it("masks contact details in the incoming realtime body", () => {
    const incoming = makeRow({ body: "пиши мне +7 999 123-45-67 или mail@example.com" });

    const [added] = mergeRealtimeMessage([], incoming);

    expect(added.body).toBe("пиши мне [контакт скрыт] или [контакт скрыт]");
    expect(added.body).not.toContain("999");
    expect(added.body).not.toContain("mail@example.com");
  });

  it("dedupes by id so a message already in cache is not appended twice", () => {
    const existing: MessageWithSender = {
      ...makeRow({ id: "dup" }),
      sender_profile: null,
      sender_display_name: null,
    };

    const result = mergeRealtimeMessage([existing], makeRow({ id: "dup", body: "+7 999 000-00-00" }));

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(existing);
  });

  it("appends non-PII messages unchanged and null-fills sender fields", () => {
    const [added] = mergeRealtimeMessage([], makeRow({ id: "m2", body: "во сколько встречаемся?" }));

    expect(added.body).toBe("во сколько встречаемся?");
    expect(added.sender_profile).toBeNull();
    expect(added.sender_display_name).toBeNull();
  });
});
