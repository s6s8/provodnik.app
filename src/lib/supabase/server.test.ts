import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookies, createServerClient } = vi.hoisted(() => ({
  cookies: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("@/lib/env", () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
  hasSupabaseEnv: () => true,
}));

import { createSupabaseServerClient } from "./server";

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports cookie write failures instead of swallowing them silently", async () => {
    const error = new Error("readonly cookies");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    cookies.mockResolvedValue({
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw error;
      }),
    });
    createServerClient.mockReturnValue({ ok: true });

    await createSupabaseServerClient();
    const [, , options] = createServerClient.mock.calls[0];
    options.cookies.setAll([{ name: "sb", value: "token", options: {} }]);

    expect(consoleError).toHaveBeenCalledWith(
      "[supabase] failed to persist auth cookies:",
      error,
    );
  });
});
