import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, getOpenRequests } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getOpenRequests: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getOpenRequests,
}));

vi.mock("@/features/requests/components/public-requests-marketplace-screen", () => ({
  PublicRequestsMarketplaceScreen: ({ initialData }: { initialData: unknown }) => (
    <div data-testid="marketplace">{JSON.stringify(initialData)}</div>
  ),
}));

import RequestsPage from "./page";

describe("RequestsPage", () => {
  it("logs the initial requests load failure before rendering fallback data", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockRejectedValue(error);

    await RequestsPage();

    expect(consoleError).toHaveBeenCalledWith(
      "[RequestsPage] failed to load initial requests:",
      error,
    );
  });
});
