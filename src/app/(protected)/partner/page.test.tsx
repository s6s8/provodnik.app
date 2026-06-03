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

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

vi.mock("@/features/partner/components/ApiTokenManager", () => ({
  ApiTokenManager: () => <div>API token manager</div>,
}));

vi.mock("@/features/partner/components/PayoutsLedger", () => ({
  PayoutsLedger: () => <div>Payouts ledger</div>,
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_PARTNER: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import PartnerCabinetPage from "./page";

describe("PartnerCabinetPage", () => {
  it("preserves the partner return path when redirecting unauthenticated users", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(PartnerCabinetPage()).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Fpartner",
    );

    expect(redirect).toHaveBeenCalledWith("/auth?next=%2Fpartner");
  });
});
