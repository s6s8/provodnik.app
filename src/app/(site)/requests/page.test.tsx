import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, loadPublicOpenRequestsPage } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  loadPublicOpenRequestsPage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/public-open-requests-page", () => ({
  loadPublicOpenRequestsPage,
}));

vi.mock("@/features/requests/components/public-requests-marketplace-screen", () => ({
  PublicRequestsMarketplaceScreen: ({
    initialData,
    initialHasMore,
    initialOffset,
    initialFilters,
  }: {
    initialData: unknown;
    initialHasMore?: boolean;
    initialOffset?: number;
    initialFilters?: unknown;
  }) => (
    <div data-testid="marketplace">
      {JSON.stringify({ initialData, initialHasMore, initialOffset, initialFilters })}
    </div>
  ),
}));

import { RequestsContent } from "./page";

const emptySearchParams = Promise.resolve({});

describe("RequestsPage", () => {
  it("loads a paged open-request catalog for the marketplace", async () => {
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    loadPublicOpenRequestsPage.mockResolvedValue({
      items: [{ id: "assembly-request", group: { openToMoreMembers: true } }],
      hasMore: true,
      error: null,
    });

    const rendered = await RequestsContent({ searchParams: emptySearchParams });

    expect(loadPublicOpenRequestsPage).toHaveBeenCalledWith(supabaseClient, 0, 24);
    expect(rendered.props.initialData).toHaveLength(1);
    expect(rendered.props.initialData[0].id).toBe("assembly-request");
    expect(rendered.props.initialHasMore).toBe(true);
    expect(rendered.props.initialOffset).toBe(1);
  });

  it("passes null initialData to the catalog when the board is empty", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    loadPublicOpenRequestsPage.mockResolvedValue({ items: [], hasMore: false, error: null });

    const rendered = await RequestsContent({ searchParams: emptySearchParams });

    expect(rendered.props.initialData).toEqual([]);
    expect(rendered.props.initialHasMore).toBe(false);
  });

  it("passes parsed marketplace filters from searchParams to the screen", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    loadPublicOpenRequestsPage.mockResolvedValue({ items: [], hasMore: false, error: null });

    const rendered = await RequestsContent({
      searchParams: Promise.resolve({
        q: "кремль",
        city: "Казань",
        when: "next-month",
        theme: "history_culture,food",
      }),
    });

    expect(rendered.props.initialFilters).toEqual({
      q: "кремль",
      city: "Казань",
      when: "next-month",
      from: null,
      to: null,
      themeSlugs: ["history_culture", "food"],
    });
  });

  it("renders the error Alert when the query returns an error", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    loadPublicOpenRequestsPage.mockResolvedValue({
      items: [],
      hasMore: false,
      error: new Error("boom"),
    });

    render(await RequestsContent({ searchParams: emptySearchParams }));

    expect(
      screen.getByText("Не удалось загрузить запросы. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace")).not.toBeInTheDocument();
  });

  it("renders the error Alert when the load throws", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    loadPublicOpenRequestsPage.mockRejectedValue(new Error("database unavailable"));

    render(await RequestsContent({ searchParams: emptySearchParams }));

    expect(
      screen.getByText("Не удалось загрузить запросы. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace")).not.toBeInTheDocument();
  });
});
