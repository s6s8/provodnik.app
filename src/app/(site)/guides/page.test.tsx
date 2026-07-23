import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getGuidesPagedMock, readAuthContextMock, gridPropsSpy } = vi.hoisted(() => ({
  getGuidesPagedMock: vi.fn(),
  readAuthContextMock: vi.fn(),
  gridPropsSpy: vi.fn(),
}));

vi.mock("@/data/supabase/queries", () => ({
  getGuidesPaged: getGuidesPagedMock,
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/features/guide/components/public/public-guides-grid", () => ({
  PublicGuidesGrid: (props: Record<string, unknown>) => {
    gridPropsSpy(props);
    return <div data-testid="public-guides-grid" />;
  },
}));

import { GuidesContent } from "./page";

describe("GuidesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readAuthContextMock.mockResolvedValue({ role: "guide" });
  });

  it("delegates to PublicGuidesGrid with the fetched guides", async () => {
    getGuidesPagedMock.mockResolvedValueOnce({
      data: [{ id: "g1" }],
      error: null,
      hasMore: true,
    });

    render(await GuidesContent({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("public-guides-grid")).toBeInTheDocument();
    expect(gridPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        guides: [{ id: "g1" }],
        loadError: false,
        hasMore: true,
        page: 1,
      }),
    );
  });

  it("forwards loadError when the query fails", async () => {
    getGuidesPagedMock.mockResolvedValueOnce({ data: null, error: new Error("boom"), hasMore: false });

    render(await GuidesContent({ searchParams: Promise.resolve({}) }));

    expect(gridPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ loadError: true }),
    );
  });

  it("hides the guide CTA for guides and shows it for everyone else", async () => {
    getGuidesPagedMock.mockResolvedValue({ data: [], error: null, hasMore: false });

    readAuthContextMock.mockResolvedValueOnce({ role: "guide" });
    render(await GuidesContent({ searchParams: Promise.resolve({}) }));
    expect(gridPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ showGuideCta: false }),
    );

    readAuthContextMock.mockResolvedValueOnce({ role: "traveler" });
    render(await GuidesContent({ searchParams: Promise.resolve({}) }));
    expect(gridPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ showGuideCta: true }),
    );
  });
});
