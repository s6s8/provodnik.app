import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, redirect } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect,
}));

vi.mock("@/features/disputes/components/DisputeThread", () => ({
  DisputeThread: () => <div>Dispute thread</div>,
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_DISPUTES: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import DisputeDetailPage from "./page";

describe("DisputeDetailPage", () => {
  it("preserves the dispute return path when redirecting unauthenticated users", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(
      DisputeDetailPage({ params: Promise.resolve({ id: "dispute-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth?next=%2Fdisputes%2Fdispute-1");

    expect(redirect).toHaveBeenCalledWith(
      "/auth?next=%2Fdisputes%2Fdispute-1",
    );
  });
});
