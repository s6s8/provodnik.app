import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const limit = vi.fn();

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "ilike", "gte", "lte", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.limit = limit;
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => makeBuilder()),
  })),
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

vi.mock("@/components/shared/list-hero", () => ({
  ListHero: () => <div>ListHero</div>,
}));

vi.mock("@/components/traveler/FilterBar", () => ({
  FilterBar: () => <div>FilterBar</div>,
}));

vi.mock("@/components/traveler/ListingGrid", () => ({
  ListingGrid: () => <div aria-label="grid">ListingGrid</div>,
}));

import SearchPage from "./page";

describe("SearchPage", () => {
  it("renders an honest result count from count:'exact'", async () => {
    limit.mockResolvedValueOnce({
      data: [{ id: "1", slug: "a" }],
      error: null,
      count: 57,
    });

    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Найдено 57 предложений")).toBeInTheDocument();
  });

  it("renders the error Alert when the query errors", async () => {
    limit.mockResolvedValueOnce({
      data: null,
      error: new Error("boom"),
      count: null,
    });

    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("Не удалось выполнить поиск. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("grid")).not.toBeInTheDocument();
  });
});
