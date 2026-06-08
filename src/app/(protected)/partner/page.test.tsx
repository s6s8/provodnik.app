import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerPayoutsLedgerRow, Uuid } from "@/lib/supabase/types";

type PartnerAccount = {
  id: Uuid;
  created_at: string;
};

type QueryResponse<T> = {
  data: T;
  error: Error | null;
};

type PartnerSupabaseMockOptions = {
  user: { id: string } | null;
  accountResponse?: QueryResponse<PartnerAccount | null>;
  ledgerResponse?: QueryResponse<PartnerPayoutsLedgerRow[] | null>;
};

const {
  apiTokenManagerMock,
  createSupabaseServerClient,
  payoutsLedgerMock,
  redirect,
} = vi.hoisted(() => ({
  apiTokenManagerMock: vi.fn(),
  createSupabaseServerClient: vi.fn(),
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

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_PARTNER: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import PartnerCabinetPage from "./page";

function setupSupabase({
  user,
  accountResponse = { data: null, error: null },
  ledgerResponse = { data: [], error: null },
}: PartnerSupabaseMockOptions) {
  const accountQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(accountResponse),
  };
  accountQuery.select.mockReturnValue(accountQuery);
  accountQuery.eq.mockReturnValue(accountQuery);

  const ledgerQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue(ledgerResponse),
  };
  ledgerQuery.select.mockReturnValue(ledgerQuery);
  ledgerQuery.eq.mockReturnValue(ledgerQuery);
  ledgerQuery.order.mockReturnValue(ledgerQuery);

  const from = vi.fn((table: string) => {
    if (table === "partner_accounts") return accountQuery;
    if (table === "partner_payouts_ledger") return ledgerQuery;

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

  return { accountQuery, from, ledgerQuery };
}

describe("PartnerCabinetPage", () => {
  beforeEach(() => {
    apiTokenManagerMock.mockClear();
    createSupabaseServerClient.mockReset();
    payoutsLedgerMock.mockClear();
    redirect.mockClear();
  });

  it("preserves the partner return path when redirecting unauthenticated users", async () => {
    setupSupabase({ user: null });

    await expect(PartnerCabinetPage()).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Fpartner",
    );

    expect(redirect).toHaveBeenCalledWith("/auth?next=%2Fpartner");
  });

  it("throws before rendering success UI when the partner account query fails", async () => {
    setupSupabase({
      user: { id: "user-1" },
      accountResponse: {
        data: null,
        error: new Error("account rls denied"),
      },
    });

    await expect(PartnerCabinetPage()).rejects.toThrow("account rls denied");

    expect(apiTokenManagerMock).not.toHaveBeenCalled();
    expect(payoutsLedgerMock).not.toHaveBeenCalled();
  });

  it("throws before rendering payouts UI when the ledger query fails", async () => {
    setupSupabase({
      user: { id: "user-1" },
      accountResponse: {
        data: {
          id: "partner-1" as Uuid,
          created_at: "2026-06-08T10:00:00.000Z",
        },
        error: null,
      },
      ledgerResponse: {
        data: null,
        error: new Error("ledger rls denied"),
      },
    });

    await expect(PartnerCabinetPage()).rejects.toThrow("ledger rls denied");

    expect(apiTokenManagerMock).not.toHaveBeenCalled();
    expect(payoutsLedgerMock).not.toHaveBeenCalled();
  });

  it("renders an empty ledger and no existing token when the user has no partner account", async () => {
    const { ledgerQuery } = setupSupabase({
      user: { id: "user-1" },
      accountResponse: { data: null, error: null },
      ledgerResponse: { data: [], error: null },
    });

    render(await PartnerCabinetPage());

    expect(ledgerQuery.eq).toHaveBeenCalledWith("partner_id", "none");
    expect(apiTokenManagerMock).toHaveBeenCalledWith({
      hasExistingToken: false,
      generatedAt: null,
    });
    expect(payoutsLedgerMock).toHaveBeenCalledWith({ ledger: [] });
  });

  it("passes the existing token state and ledger rows when both queries succeed", async () => {
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
      accountResponse: {
        data: {
          id: "partner-1" as Uuid,
          created_at: "2026-06-08T10:00:00.000Z",
        },
        error: null,
      },
      ledgerResponse: { data: ledgerRows, error: null },
    });

    render(await PartnerCabinetPage());

    expect(apiTokenManagerMock).toHaveBeenCalledWith({
      hasExistingToken: true,
      generatedAt: "2026-06-08T10:00:00.000Z",
    });
    expect(payoutsLedgerMock).toHaveBeenCalledWith({ ledger: ledgerRows });
  });
});
