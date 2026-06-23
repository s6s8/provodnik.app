import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  it("renders the error Alert and not the discovery screen when the query errors", async () => {
    getActiveListings.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Не удалось загрузить экскурсии. Попробуйте обновить страницу.")).toBeInTheDocument();
    expect(screen.queryByLabelText("discovery")).not.toBeInTheDocument();
  });
});
