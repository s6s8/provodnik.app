import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import {
  confirmPaymentAgreement,
  getPaymentAgreementForBooking,
} from "./payment-agreements";

beforeEach(() => {
  createSupabaseServerClient.mockReset();
});

describe("getPaymentAgreementForBooking", () => {
  it("maps a snake_case row to the camelCase model", async () => {
    const row = {
      id: "agreement-1",
      booking_id: "booking-1",
      agreed_total_minor: 150000,
      currency: "RUB",
      method: "in_person",
      traveler_confirmed_at: "2026-06-23T10:00:00Z",
      guide_confirmed_at: null,
    };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const result = await getPaymentAgreementForBooking("booking-1");

    expect(result).toEqual({
      id: "agreement-1",
      bookingId: "booking-1",
      agreedTotalMinor: 150000,
      currency: "RUB",
      method: "in_person",
      travelerConfirmedAt: "2026-06-23T10:00:00Z",
      guideConfirmedAt: null,
    });
    expect(query.eq).toHaveBeenCalledWith("booking_id", "booking-1");
  });

  it("returns null when no agreement exists", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    await expect(getPaymentAgreementForBooking("booking-x")).resolves.toBeNull();
  });
});

describe("confirmPaymentAgreement", () => {
  function buildClient(userId: string | null, booking: unknown) {
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const bookingQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: booking, error: null }),
    };
    const from = vi.fn((table: string) => {
      if (table === "bookings") return bookingQuery;
      if (table === "payment_agreements") return updateQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    const client = {
      from,
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
      },
    };
    return { client, updateQuery };
  }

  it("stamps traveler_confirmed_at when the caller is the traveler", async () => {
    const { client, updateQuery } = buildClient("traveler-1", {
      id: "booking-1",
      traveler_id: "traveler-1",
      guide_id: "guide-1",
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await confirmPaymentAgreement("booking-1");

    expect(result).toEqual({ ok: true });
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ traveler_confirmed_at: expect.any(String) }),
    );
    expect(updateQuery.eq).toHaveBeenCalledWith("booking_id", "booking-1");
  });

  it("stamps guide_confirmed_at when the caller is the guide", async () => {
    const { client, updateQuery } = buildClient("guide-1", {
      id: "booking-1",
      traveler_id: "traveler-1",
      guide_id: "guide-1",
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await confirmPaymentAgreement("booking-1");

    expect(result).toEqual({ ok: true });
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ guide_confirmed_at: expect.any(String) }),
    );
  });

  it("returns an access error when the caller is neither party", async () => {
    const { client, updateQuery } = buildClient("stranger-1", {
      id: "booking-1",
      traveler_id: "traveler-1",
      guide_id: "guide-1",
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await confirmPaymentAgreement("booking-1");

    expect(result).toEqual({ ok: false, error: "Нет доступа" });
    expect(updateQuery.update).not.toHaveBeenCalled();
  });
});
