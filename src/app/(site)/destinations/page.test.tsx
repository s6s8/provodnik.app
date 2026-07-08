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
    redirectMock.mockClear();
    getDestinations.mockReset();
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
  });

  it("redirects to /guides when the public catalog is hidden (Wildberries review)", async () => {
    flagsMock.FEATURE_PUBLIC_CATALOG = false;

    await expect(DestinationsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/guides");
    expect(getDestinations).not.toHaveBeenCalled();
  });

  it("renders the discovery screen when the catalog is enabled", async () => {
    getDestinations.mockResolvedValueOnce({ data: [], error: null });

    render(await DestinationsPage());

    expect(screen.getByLabelText("discovery")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
