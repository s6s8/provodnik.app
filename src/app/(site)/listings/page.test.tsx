import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

const { redirectMock, flagsMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  flagsMock: { FEATURE_PUBLIC_CATALOG: true },
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/flags", () => ({ flags: flagsMock }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({})),
}));

const getActiveListings = vi.fn();
vi.mock("@/data/supabase/queries", () => ({
  getActiveListings: (...args: unknown[]) => getActiveListings(...args),
}));

vi.mock("@/features/listings/components/public/public-listing-discovery-screen", () => ({
  PublicListingDiscoveryScreen: () => (
    <section aria-label="discovery">PublicListingDiscoveryScreen</section>
  ),
}));

import PublicListingsPage from "./page";

describe("PublicListingsPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getActiveListings.mockReset();
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
  });

  it("redirects to /guides when the public catalog is hidden (Wildberries review)", async () => {
    flagsMock.FEATURE_PUBLIC_CATALOG = false;

    await expect(
      PublicListingsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/guides");
    expect(getActiveListings).not.toHaveBeenCalled();
  });

  it("renders the error Alert and not the discovery screen when the query errors", async () => {
    getActiveListings.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Не удалось загрузить экскурсии. Попробуйте обновить страницу.")).toBeInTheDocument();
    expect(screen.queryByLabelText("discovery")).not.toBeInTheDocument();
  });
});
