import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getGuidesMock, readAuthContextMock } = vi.hoisted(() => ({
  getGuidesMock: vi.fn(),
  readAuthContextMock: vi.fn(),
}));

vi.mock("@/data/supabase/queries", () => ({
  getGuides: getGuidesMock,
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/features/guide/components/public/public-guides-grid", () => ({
  PublicGuidesGrid: () => <div data-testid="public-guides-grid" />,
}));

import GuidesPage from "./page";

describe("GuidesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readAuthContextMock.mockResolvedValue({ role: "guide" });
  });

  it("renders the EmptyState when there are no guides, specs, or query", async () => {
    getGuidesMock.mockResolvedValueOnce({ data: [], error: null });

    const ui = await GuidesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText("Пока нет гидов")).toBeInTheDocument();
    expect(screen.queryByTestId("public-guides-grid")).not.toBeInTheDocument();
  });

  it("renders an error alert when the query fails", async () => {
    getGuidesMock.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    const ui = await GuidesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(
      screen.getByText("Не удалось загрузить гидов. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Пока нет гидов")).not.toBeInTheDocument();
  });

  it("renders the grid when guides are present", async () => {
    getGuidesMock.mockResolvedValueOnce({
      data: [{ id: "g1" }],
      error: null,
    });

    const ui = await GuidesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByTestId("public-guides-grid")).toBeInTheDocument();
    expect(screen.queryByText("Пока нет гидов")).not.toBeInTheDocument();
  });
});
