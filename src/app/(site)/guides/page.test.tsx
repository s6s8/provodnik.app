import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getGuidesMock, readAuthContextMock, gridPropsSpy } = vi.hoisted(() => ({
  getGuidesMock: vi.fn(),
  readAuthContextMock: vi.fn(),
  gridPropsSpy: vi.fn(),
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

// The discovery shell (hero + error/empty/grid + "Вы гид?" CTA) now lives in
// PublicGuidesGrid so the hero is full-bleed; the page just fetches and delegates.
vi.mock("@/features/guide/components/public/public-guides-grid", () => ({
  PublicGuidesGrid: (props: Record<string, unknown>) => {
    gridPropsSpy(props);
    return <div data-testid="public-guides-grid" />;
  },
}));

import GuidesPage from "./page";

describe("GuidesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readAuthContextMock.mockResolvedValue({ role: "guide" });
  });

  it("delegates to PublicGuidesGrid with the fetched guides", async () => {
    getGuidesMock.mockResolvedValueOnce({ data: [{ id: "g1" }], error: null });

    render(await GuidesPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("public-guides-grid")).toBeInTheDocument();
    expect(gridPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ guides: [{ id: "g1" }], loadError: false }),
    );
  });

  it("forwards loadError when the query fails", async () => {
    getGuidesMock.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    render(await GuidesPage({ searchParams: Promise.resolve({}) }));

    expect(gridPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ loadError: true }),
    );
  });

  it("hides the guide CTA for guides and shows it for everyone else", async () => {
    getGuidesMock.mockResolvedValue({ data: [], error: null });

    readAuthContextMock.mockResolvedValueOnce({ role: "guide" });
    render(await GuidesPage({ searchParams: Promise.resolve({}) }));
    expect(gridPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ showGuideCta: false }),
    );

    readAuthContextMock.mockResolvedValueOnce({ role: "traveler" });
    render(await GuidesPage({ searchParams: Promise.resolve({}) }));
    expect(gridPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ showGuideCta: true }),
    );
  });
});
