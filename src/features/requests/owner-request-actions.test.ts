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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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

import { cancelRequestAction, rejectOfferAction } from "./owner-request-actions";

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

describe("rejectOfferAction", () => {
  function buildRejectSupabase(updateResult: {
    data: { id: string } | null;
    error: { message: string } | null;
  }) {
    const requestQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "request-1", traveler_id: "traveler-1", status: "open" },
            error: null,
          }),
        }),
      }),
    };

    const updateMaybeSingle = vi.fn().mockResolvedValue(updateResult);
    const updateSelect = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
    const statusEq = vi.fn().mockReturnValue({ select: updateSelect });
    const idEq = vi.fn().mockReturnValue({ eq: statusEq });
    const update = vi.fn().mockReturnValue({ eq: idEq });

    const offersQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "offer-1", request_id: "request-1", status: "pending" },
            error: null,
          }),
        }),
      }),
      update,
    };

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "traveler-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "traveler_requests") return requestQuery;
        if (table === "guide_offers") return offersQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    return { statusEq, updateSelect };
  }

  function buildRejectFormData() {
    const formData = new FormData();
    formData.set("offer_id", "offer-1");
    formData.set("request_id", "request-1");
    return formData;
  }

  it("declines only an offer that is still pending", async () => {
    const { statusEq, updateSelect } = buildRejectSupabase({
      data: { id: "offer-1" },
      error: null,
    });

    const result = await rejectOfferAction({ error: null }, buildRejectFormData());

    expect(result.error).toBeNull();
    expect(statusEq).toHaveBeenCalledWith("status", "pending");
    expect(updateSelect).toHaveBeenCalledWith("id");
  });

  it("reports a conflict when the offer stopped being pending mid-flight", async () => {
    // Guide withdraws (or a parallel accept lands) between the status read and
    // the write: the conditional update matches zero rows, so decline must fail.
    buildRejectSupabase({ data: null, error: null });

    const result = await rejectOfferAction({ error: null }, buildRejectFormData());

    expect(result.error).toBe("Предложение уже не активно.");
  });
});
