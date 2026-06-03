import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInsert = vi.fn();
const mockListingSingle = vi.fn();
const mockRequestSingle = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "traveler-1" } } }),
    },
    from: (table: string) => {
      if (table === "listings") {
        return {
          select: () => ({
            eq: () => ({
              single: mockListingSingle,
            }),
          }),
        };
      }

      if (table === "traveler_requests") {
        return {
          insert: mockInsert,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

import { submitRequest } from "./submitRequest";

describe("submitRequest", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockListingSingle.mockReset();
    mockRequestSingle.mockReset();

    mockListingSingle.mockResolvedValue({
      data: {
        id: "listing-1",
        guide_id: "guide-1",
        status: "published",
        price_from_minor: 100000,
      },
      error: null,
    });
    mockRequestSingle.mockResolvedValue({
      data: { id: "request-1" },
      error: null,
    });
    mockInsert.mockReturnValue({
      select: () => ({
        single: mockRequestSingle,
      }),
    });
  });

  it("persists open-to-join and interests for group listing requests", async () => {
    await expect(
      submitRequest({
        listingId: "listing-1",
        guideId: "guide-1",
        destination: "Элиста",
        region: "Калмыкия",
        category: "history",
        startsOn: "2026-06-10",
        participantsCount: 2,
        formatPreference: "group",
        mode: "order",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/requests/request-1");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        open_to_join: true,
        interests: ["history"],
      }),
    );
  });

  it("throws a coded error when request creation fails", async () => {
    mockRequestSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });

    await expect(
      submitRequest({
        listingId: "listing-1",
        guideId: "guide-1",
        destination: "Элиста",
        region: "Калмыкия",
        category: "history",
        startsOn: "2026-06-10",
        participantsCount: 2,
        mode: "order",
      }),
    ).rejects.toThrow("request_create_failed");
  });
});
