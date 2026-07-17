import { beforeEach, describe, expect, it, vi } from "vitest";

const { createNotification, createSupabaseServerClient, redirect } = vi.hoisted(() => ({
  createNotification: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/notifications/create-notification", () => ({
  createNotification,
}));

vi.mock("@/lib/notifications/triggers", () => ({
  notifyBookingCreated: vi.fn(),
}));

vi.mock("@/lib/supabase/conversations", () => ({
  getOrCreateThread: vi.fn(),
}));

vi.mock("@/lib/supabase/bookings", () => ({
  createBooking: vi.fn(),
}));

import { cancelRequestAction } from "./owner-request-actions";

function buildFormData(requestId: string) {
  const formData = new FormData();
  formData.set("request_id", requestId);
  return formData;
}

function buildSupabaseMock(requestStatus: "booked" | "open") {
  const requestId = "request-1";
  const travelerId = "traveler-1";

  const requestSelectQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        id: requestId,
        traveler_id: travelerId,
        status: requestStatus,
        destination: "Элиста",
        starts_on: "2026-07-01",
      },
      error: null,
    }),
  };
  const requestUpdateQuery = {
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  const requestQuery = {
    select: vi.fn().mockReturnValue(requestSelectQuery),
    update: vi.fn().mockReturnValue(requestUpdateQuery),
  };

  const offersQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const bookingUpdateQuery = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ error: null }),
  };
  const bookingsQuery = {
    update: vi.fn().mockReturnValue(bookingUpdateQuery),
  };

  const from = vi.fn((table: string) => {
    if (table === "traveler_requests") return requestQuery;
    if (table === "guide_offers") return offersQuery;
    if (table === "bookings") return bookingsQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  const rpc = vi.fn().mockResolvedValue({ error: null });

  createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: travelerId } },
        error: null,
      }),
    },
    from,
    rpc,
  });

  return {
    bookingUpdateQuery,
    bookingsQuery,
    rpc,
    requestId,
    travelerId,
  };
}

beforeEach(() => {
  createNotification.mockReset();
  createSupabaseServerClient.mockReset();
  redirect.mockClear();
});

describe("cancelRequestAction", () => {
  it("cancels the request and its bookings atomically via the RPC", async () => {
    const { rpc, bookingsQuery, requestId } = buildSupabaseMock("booked");

    await expect(cancelRequestAction({ error: null }, buildFormData(requestId))).rejects.toThrow(
      "NEXT_REDIRECT:/trips",
    );

    // The request + booking cancellation is one transactional RPC, not two writes.
    expect(rpc).toHaveBeenCalledWith("cancel_traveler_request", { p_request_id: requestId });
    expect(bookingsQuery.update).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/trips");
  });

  it("surfaces a friendly error when the RPC rejects the cancel", async () => {
    const { rpc, requestId } = buildSupabaseMock("open");
    rpc.mockResolvedValueOnce({ error: { message: "not_cancellable" } });

    const result = await cancelRequestAction({ error: null }, buildFormData(requestId));

    expect(result.error).toBe("Запрос нельзя отменить в текущем статусе.");
    expect(redirect).not.toHaveBeenCalled();
  });
});
