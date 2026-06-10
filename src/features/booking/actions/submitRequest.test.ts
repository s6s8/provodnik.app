import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, mockInsert, mockListingSingle, mockRequestSingle } = vi.hoisted(() => {
  const insert = vi.fn();
  const listingSingle = vi.fn();
  const requestSingle = vi.fn();
  const client = vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "traveler-1" } } }),
    },
    from: (table: string) => {
      if (table === "listings") {
        return {
          select: () => ({
            eq: () => ({
              single: listingSingle,
            }),
          }),
        };
      }

      if (table === "traveler_requests") {
        return {
          insert,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }));

  return {
    createClient: client,
    mockInsert: insert,
    mockListingSingle: listingSingle,
    mockRequestSingle: requestSingle,
  };
});

const listingId = "550e8400-e29b-41d4-a716-446655440000";
const guideId = "650e8400-e29b-41d4-a716-446655440000";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createClient,
}));

import { submitRequest } from "./submitRequest";

describe("submitRequest", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockListingSingle.mockReset();
    mockRequestSingle.mockReset();
    createClient.mockClear();

    mockListingSingle.mockResolvedValue({
      data: {
        id: listingId,
        guide_id: guideId,
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
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history_culture",
        startsOn: "2026-06-10",
        participantsCount: 2,
        formatPreference: "group",
        mode: "order",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/requests/request-1");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        open_to_join: true,
        interests: ["history_culture"],
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
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history",
        startsOn: "2026-06-10",
        participantsCount: 2,
        mode: "order",
      }),
    ).rejects.toThrow("request_create_failed");
  });

  it("rejects an invalid payload before creating the Supabase client", async () => {
    await expect(
      submitRequest({
        listingId: "not-a-uuid",
        guideId: "x",
        destination: "",
        region: "",
        category: "",
        startsOn: "bad",
        participantsCount: 0,
      }),
    ).rejects.toThrow("invalid_input");

    expect(createClient).not.toHaveBeenCalled();
  });
});
