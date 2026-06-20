import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BonusLedgerRow, PartnerPayoutsLedgerRow, Uuid } from "@/lib/supabase/types";

type QueryResponse<T> = {
  data: T;
  error: Error | null;
};

type ReferralCodeRow = {
  id: Uuid;
  code: string;
};

type PartnerAccount = {
  id: Uuid;
  created_at: string;
};

type ReferralsSupabaseMockOptions = {
  user: { id: string } | null;
  codeResponse?: QueryResponse<ReferralCodeRow | null>;
  redemptionCount?: number;
  bonusLedgerResponse?: QueryResponse<BonusLedgerRow[] | null>;
  partnerAccountResponse?: QueryResponse<PartnerAccount | null>;
  partnerLedgerResponse?: QueryResponse<PartnerPayoutsLedgerRow[] | null>;
};

const {
  apiTokenManagerMock,
  createSupabaseServerClient,
  flags,
  payoutsLedgerMock,
  redirect,
} = vi.hoisted(() => ({
  apiTokenManagerMock: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  flags: {
    FEATURE_TR_REFERRALS: true,
    FEATURE_TR_PARTNER: false,
  },
  payoutsLedgerMock: vi.fn(),
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
  ApiTokenManager: (props: { hasExistingToken: boolean; generatedAt?: string | null }) => {
    apiTokenManagerMock(props);

    return <div>API token manager</div>;
  },
}));

vi.mock("@/features/partner/components/PayoutsLedger", () => ({
  PayoutsLedger: (props: { ledger: PartnerPayoutsLedgerRow[] }) => {
    payoutsLedgerMock(props);

    return <div>Payouts ledger</div>;
  },
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
  flags,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import ReferralsPage from "./page";

function setupSupabase({
  user,
  codeResponse = { data: { id: "code-1" as Uuid, code: "IVAN100" }, error: null },
  redemptionCount = 2,
  bonusLedgerResponse = { data: [], error: null },
  partnerAccountResponse = { data: null, error: null },
  partnerLedgerResponse = { data: [], error: null },
}: ReferralsSupabaseMockOptions) {
  const referralCodesQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(codeResponse),
  };
  referralCodesQuery.select.mockReturnValue(referralCodesQuery);
  referralCodesQuery.eq.mockReturnValue(referralCodesQuery);

  const redemptionsQuery = {
    select: vi.fn(),
    eq: vi.fn().mockResolvedValue({ count: redemptionCount }),
  };
  redemptionsQuery.select.mockReturnValue(redemptionsQuery);

  const bonusLedgerQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn().mockResolvedValue(bonusLedgerResponse),
  };
  bonusLedgerQuery.select.mockReturnValue(bonusLedgerQuery);
  bonusLedgerQuery.eq.mockReturnValue(bonusLedgerQuery);

  const partnerAccountQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(partnerAccountResponse),
  };
  partnerAccountQuery.select.mockReturnValue(partnerAccountQuery);
  partnerAccountQuery.eq.mockReturnValue(partnerAccountQuery);

  const partnerLedgerQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue(partnerLedgerResponse),
  };
  partnerLedgerQuery.select.mockReturnValue(partnerLedgerQuery);
  partnerLedgerQuery.eq.mockReturnValue(partnerLedgerQuery);
  partnerLedgerQuery.order.mockReturnValue(partnerLedgerQuery);

  const from = vi.fn((table: string) => {
    if (table === "referral_codes") return referralCodesQuery;
    if (table === "referral_redemptions") return redemptionsQuery;
    if (table === "bonus_ledger") return bonusLedgerQuery;
    if (table === "partner_accounts") return partnerAccountQuery;
    if (table === "partner_payouts_ledger") return partnerLedgerQuery;

    throw new Error(`Unexpected table: ${table}`);
  });

  createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from,
  });

  return { from, partnerAccountQuery, partnerLedgerQuery };
}

describe("ReferralsPage", () => {
  beforeEach(() => {
    apiTokenManagerMock.mockClear();
    createSupabaseServerClient.mockReset();
    flags.FEATURE_TR_REFERRALS = true;
    flags.FEATURE_TR_PARTNER = false;
    payoutsLedgerMock.mockClear();
    redirect.mockClear();
  });

  it("preserves the referrals return path when redirecting unauthenticated users", async () => {
    setupSupabase({ user: null });

    await expect(ReferralsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Freferrals",
    );

    expect(redirect).toHaveBeenCalledWith("/auth?next=%2Freferrals");
  });

  it("renders referral content without partner cabinet when the partner flag is off", async () => {
    const { from } = setupSupabase({ user: { id: "user-1" } });

    render(await ReferralsPage());

    expect(screen.getByText("Referral code")).toBeInTheDocument();
    expect(screen.getByText("Bonus ledger")).toBeInTheDocument();
    expect(screen.queryByText("API token manager")).not.toBeInTheDocument();
    expect(screen.queryByText("Payouts ledger")).not.toBeInTheDocument();
    expect(from).not.toHaveBeenCalledWith("partner_accounts");
    expect(from).not.toHaveBeenCalledWith("partner_payouts_ledger");
  });

  it("renders referral content and partner cabinet when the partner flag is on", async () => {
    flags.FEATURE_TR_PARTNER = true;

    setupSupabase({ user: { id: "user-1" } });

    render(await ReferralsPage());

    expect(screen.getByText("Referral code")).toBeInTheDocument();
    expect(screen.getByText("Bonus ledger")).toBeInTheDocument();
    expect(screen.getByText("Партнёрский API")).toBeInTheDocument();
    expect(screen.getByText("API token manager")).toBeInTheDocument();
    expect(screen.getByText("Payouts ledger")).toBeInTheDocument();
    expect(apiTokenManagerMock).toHaveBeenCalledWith({
      hasExistingToken: false,
      generatedAt: null,
    });
    expect(payoutsLedgerMock).toHaveBeenCalledWith({ ledger: [] });
  });

  it("throws before rendering partner UI when the partner account query fails", async () => {
    flags.FEATURE_TR_PARTNER = true;

    setupSupabase({
      user: { id: "user-1" },
      partnerAccountResponse: {
        data: null,
        error: new Error("account rls denied"),
      },
    });

    await expect(ReferralsPage()).rejects.toThrow("account rls denied");

    expect(apiTokenManagerMock).not.toHaveBeenCalled();
    expect(payoutsLedgerMock).not.toHaveBeenCalled();
  });

  it("throws before rendering partner payouts UI when the ledger query fails", async () => {
    flags.FEATURE_TR_PARTNER = true;

    setupSupabase({
      user: { id: "user-1" },
      partnerAccountResponse: {
        data: {
          id: "partner-1" as Uuid,
          created_at: "2026-06-08T10:00:00.000Z",
        },
        error: null,
      },
      partnerLedgerResponse: {
        data: null,
        error: new Error("ledger rls denied"),
      },
    });

    await expect(ReferralsPage()).rejects.toThrow("ledger rls denied");

    expect(apiTokenManagerMock).not.toHaveBeenCalled();
    expect(payoutsLedgerMock).not.toHaveBeenCalled();
  });

  it("does not fetch partner payouts when the user has no partner account", async () => {
    flags.FEATURE_TR_PARTNER = true;

    const { from, partnerLedgerQuery } = setupSupabase({
      user: { id: "user-1" },
      partnerAccountResponse: { data: null, error: null },
      partnerLedgerResponse: { data: [], error: null },
    });

    render(await ReferralsPage());

    expect(from).not.toHaveBeenCalledWith("partner_payouts_ledger");
    expect(partnerLedgerQuery.eq).not.toHaveBeenCalledWith("partner_id", "none");
    expect(apiTokenManagerMock).toHaveBeenCalledWith({
      hasExistingToken: false,
      generatedAt: null,
    });
    expect(payoutsLedgerMock).toHaveBeenCalledWith({ ledger: [] });
  });

  it("passes the existing token state and partner ledger rows when both partner queries succeed", async () => {
    flags.FEATURE_TR_PARTNER = true;

    const ledgerRows: PartnerPayoutsLedgerRow[] = [
      {
        id: "ledger-1" as Uuid,
        partner_id: "partner-1" as Uuid,
        delta: 12500,
        ref_id: "booking-1" as Uuid,
        created_at: "2026-06-08T11:00:00.000Z",
      },
    ];

    setupSupabase({
      user: { id: "user-1" },
      partnerAccountResponse: {
        data: {
          id: "partner-1" as Uuid,
          created_at: "2026-06-08T10:00:00.000Z",
        },
        error: null,
      },
      partnerLedgerResponse: { data: ledgerRows, error: null },
    });

    render(await ReferralsPage());

    expect(apiTokenManagerMock).toHaveBeenCalledWith({
      hasExistingToken: true,
      generatedAt: "2026-06-08T10:00:00.000Z",
    });
    expect(payoutsLedgerMock).toHaveBeenCalledWith({ ledger: ledgerRows });
  });
});
