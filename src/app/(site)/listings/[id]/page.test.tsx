import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, notFound, flagsMock } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  flagsMock: {
    FEATURE_PUBLIC_CATALOG: true,
    FEATURE_TR_TOURS: false,
  },
}));

vi.mock("next/navigation", () => ({ notFound }));

vi.mock("@/lib/flags", () => ({ flags: flagsMock }));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

vi.mock("@/components/listing-detail/ExcursionShapeDetail", () => ({
  ExcursionShapeDetail: () => null,
}));

vi.mock("@/components/listing-detail/TourShapeDetail", () => ({
  TourShapeDetail: () => null,
}));

import ListingDetailPage from "./page";

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
    flagsMock.FEATURE_TR_TOURS = false;
  });

  it("returns notFound for disabled tour listings instead of a misleading excursion fallback", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "listing-tour-1",
        slug: "tour-1",
        status: "published",
        exp_type: "tour",
        guide_id: "guide-1",
      },
    });
    const slugEq = vi.fn().mockReturnValue({ maybeSingle });
    const statusEq = vi.fn().mockReturnValue({ eq: slugEq });
    const select = vi.fn().mockReturnValue({ eq: statusEq });
    const from = vi.fn((table: string) => {
      if (table === "listings") return { select };
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClient.mockResolvedValue({ from });

    await expect(
      ListingDetailPage({ params: Promise.resolve({ id: "tour-1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
