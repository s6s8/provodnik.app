import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/notifications/triggers", () => ({
  notifyNewOffer: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { checkOfferAgainstLocks, submitOfferAction } from "@/features/guide/offer-actions";

const baseRequest = {
  date_locked: true,
  time_locked: true,
  starts_on: "2026-09-10",
  start_time: "10:00:00",
  end_time: "13:00:00",
};

const makeIso = (date: string, time: string) =>
  new Date(`${date}T${time}:00+03:00`).toISOString();

describe("checkOfferAgainstLocks", () => {
  it("rejects when offer date differs and date_locked=true", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-11", "10:00"),
      endsAt: makeIso("2026-09-11", "13:00"),
      request: baseRequest,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/строго эту дату/);
    }
  });

  it("rejects when offer time differs and time_locked=true", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-10", "11:00"),
      endsAt: makeIso("2026-09-10", "14:00"),
      request: baseRequest,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/строго это время/);
    }
  });

  it("accepts when both locks are off even if date and time differ", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-12", "15:00"),
      endsAt: makeIso("2026-09-12", "18:00"),
      request: { ...baseRequest, date_locked: false, time_locked: false },
    });

    expect("ok" in result && result.ok).toBe(true);
  });

  it("accepts when locks are on and offer matches", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-10", "10:00"),
      endsAt: makeIso("2026-09-10", "13:00"),
      request: baseRequest,
    });

    expect("ok" in result && result.ok).toBe(true);
  });

  it("accepts different date when date_locked=false regardless of date mismatch", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-15", "10:00"),
      endsAt: makeIso("2026-09-15", "13:00"),
      request: { ...baseRequest, date_locked: false },
    });

    expect("ok" in result && result.ok).toBe(true);
  });
});

describe("submitOfferAction", () => {
  it("rejects unverified guide profiles before submitting an offer", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { verification_status: "draft" },
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
      },
      from,
    });

    const result = await submitOfferAction("request-1", new FormData());

    expect(result).toEqual({ error: "Доступно после верификации" });
    expect(from).toHaveBeenCalledWith("guide_profiles");
    expect(eq).toHaveBeenCalledWith("user_id", "guide-1");
  });
});
