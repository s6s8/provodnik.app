import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, isRequestMember, joinRequest, redirect } =
  vi.hoisted(() => ({
    createSupabaseServerClient: vi.fn(),
    isRequestMember: vi.fn(),
    joinRequest: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
  }));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/request-members", () => ({
  isRequestMember,
  joinRequest,
}));

import { joinRequestAction } from "./join-request-action";

describe("joinRequestAction", () => {
  it("preserves the request return path when redirecting unauthenticated users", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(joinRequestAction("request-1")).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Frequests%2Frequest-1",
    );

    expect(redirect).toHaveBeenCalledWith(
      "/auth?next=%2Frequests%2Frequest-1",
    );
    expect(isRequestMember).not.toHaveBeenCalled();
    expect(joinRequest).not.toHaveBeenCalled();
  });
});
