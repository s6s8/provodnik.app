import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

const { notFoundMock, flagsMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  flagsMock: { FEATURE_PUBLIC_CATALOG: true },
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("@/lib/flags", () => ({ flags: flagsMock }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({})),
}));

const getDestinations = vi.fn();
vi.mock("@/data/supabase/queries", () => ({
  getDestinations: (...args: unknown[]) => getDestinations(...args),
}));

vi.mock("@/features/destinations/components/destinations-discovery-screen", () => ({
  DestinationsDiscoveryScreen: () => (
    <section aria-label="discovery">DestinationsDiscoveryScreen</section>
  ),
}));

import DestinationsPage from "./page";

describe("DestinationsPage", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getDestinations.mockReset();
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
  });

  it("returns notFound when the public catalog is hidden (Wildberries review)", async () => {
    flagsMock.FEATURE_PUBLIC_CATALOG = false;

    await expect(DestinationsPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
    expect(getDestinations).not.toHaveBeenCalled();
  });

  it("renders the discovery screen when the catalog is enabled", async () => {
    getDestinations.mockResolvedValueOnce({ data: [], error: null });

    render(await DestinationsPage());

    expect(screen.getByLabelText("discovery")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
