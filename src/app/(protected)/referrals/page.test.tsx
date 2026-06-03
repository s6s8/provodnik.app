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

vi.mock("@/features/referrals/components/BonusLedger", () => ({
  BonusLedger: () => <div>Bonus ledger</div>,
}));

vi.mock("@/features/referrals/components/ReferralCode", () => ({
  ReferralCode: () => <div>Referral code</div>,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_REFERRALS: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import ReferralsPage from "./page";

describe("ReferralsPage", () => {
  it("preserves the referrals return path when redirecting unauthenticated users", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(ReferralsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Freferrals",
    );

    expect(redirect).toHaveBeenCalledWith("/auth?next=%2Freferrals");
  });
});
