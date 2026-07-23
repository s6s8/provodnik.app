import { describe, expect, it, vi } from "vitest";

import { maskPii } from "@/lib/pii/mask";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

describe("request group thread PII masking contract", () => {
  it("masks contact details in group thread message bodies before rendering", () => {
    const rawBody = "Пишите на guide@example.com или звоните +79001234567";
    const masked = maskPii(rawBody);
    expect(masked).not.toContain("guide@example.com");
    expect(masked).not.toContain("+79001234567");
    expect(masked).toContain("[контакт скрыт]");
  });
});
