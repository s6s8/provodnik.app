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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { isGuideIntervalBlocked } = vi.hoisted(() => ({
  isGuideIntervalBlocked: vi.fn(async () => false),
}));
vi.mock("@/lib/supabase/guide-availability-blocks", () => ({ isGuideIntervalBlocked }));

const { ensureOfferConversationMock } = vi.hoisted(() => ({
  ensureOfferConversationMock: vi.fn(async () => ({ threadId: "thread-1", created: true })),
}));
vi.mock("@/lib/supabase/offer-conversation", () => ({
  ensureOfferConversation: ensureOfferConversationMock,
}));

import {
  checkOfferAgainstLocks,
  submitOfferAction,
  withdrawOfferAction,
  editOfferAction,
} from "@/features/guide/offer-actions";

const baseRequest = {
  status: "open" as const,
  date_flexibility: "exact",
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

  it("accepts when few_days even if time_locked=true and offer time differs", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-12", "15:00"),
      endsAt: makeIso("2026-09-12", "18:00"),
      request: { ...baseRequest, date_flexibility: "few_days", time_locked: true },
    });

    expect("ok" in result && result.ok).toBe(true);
  });

  it("accepts when few_days and time lock are off even if date and time differ", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-12", "15:00"),
      endsAt: makeIso("2026-09-12", "18:00"),
      request: { ...baseRequest, date_flexibility: "few_days", time_locked: false },
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

  it("rejects a changed date for exact requests even when date_locked=false", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-15", "10:00"),
      endsAt: makeIso("2026-09-15", "13:00"),
      request: { ...baseRequest, date_locked: false },
    });

    expect("error" in result).toBe(true);
  });

  it("accepts a changed date for few_days requests even when date_locked=true", async () => {
    const result = await checkOfferAgainstLocks({
      startsAt: makeIso("2026-09-15", "10:00"),
      endsAt: makeIso("2026-09-15", "13:00"),
      request: { ...baseRequest, date_flexibility: "few_days" },
    });

    expect("ok" in result && result.ok).toBe(true);
  });
});

describe("submitOfferAction", () => {
  it("rejects a changed date for exact requests even when date_locked=false", async () => {
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }) }),
    });
    const guideSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { verification_status: "approved", is_available: true } }) }),
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
          }),
        }),
      }),
    });
    const requestSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { ...baseRequest, traveler_id: "trav-1", date_locked: false } }),
      }),
    });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_profiles") return { select: guideSelect };
        if (table === "guide_offers") return { select: offerSelect };
        if (table === "traveler_requests") return { select: requestSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });
    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "предложение достаточной длины для валидации");
    fd.set("valid_until", "2027-01-01");
    fd.set("starts_at", makeIso("2026-09-11", "10:00"));
    fd.set("ends_at", makeIso("2026-09-11", "13:00"));

    await expect(submitOfferAction("11111111-1111-4111-8111-111111111111", fd)).resolves.toEqual({
      error: "Путешественник просит строго эту дату.",
    });
  });

  it("rejects unverified guide profiles before submitting an offer", async () => {
    const guideMaybeSingle = vi.fn().mockResolvedValue({
      data: { verification_status: "draft" },
    });
    const guideEq = vi.fn().mockReturnValue({ maybeSingle: guideMaybeSingle });
    const guideSelect = vi.fn().mockReturnValue({ eq: guideEq });
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { account_status: "active" } });
    const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      if (table === "guide_profiles") return { select: guideSelect };
      throw new Error(`unexpected table ${table}`);
    });

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
    expect(from).toHaveBeenCalledWith("profiles");
    expect(from).toHaveBeenCalledWith("guide_profiles");
    expect(guideEq).toHaveBeenCalledWith("user_id", "guide-1");
  });

  it("rejects suspended guide accounts before submitting an offer", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { account_status: "suspended" } });
    const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      throw new Error(`unexpected table ${table}`);
    });

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

    expect(result).toEqual({ error: "Аккаунт заблокирован." });
    expect(from).not.toHaveBeenCalledWith("guide_profiles");
  });

  it("rejects an approved but paused guide before submitting an offer", async () => {
    const guideMaybeSingle = vi.fn().mockResolvedValue({
      data: { verification_status: "approved", is_available: false },
    });
    const guideEq = vi.fn().mockReturnValue({ maybeSingle: guideMaybeSingle });
    const guideSelect = vi.fn().mockReturnValue({ eq: guideEq });
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { account_status: "active" } });
    const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      if (table === "guide_profiles") return { select: guideSelect };
      throw new Error(`unexpected table ${table}`);
    });

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

    expect(result).toEqual({
      error: "Приём заявок приостановлен. Возобновите его в профиле, чтобы откликаться.",
    });
    expect(guideSelect).toHaveBeenCalledWith("verification_status, is_available");
  });

  it("ensures the offer conversation on duplicate submit retries", async () => {
    ensureOfferConversationMock.mockClear();
    const existingOffer = {
      id: "offer-existing",
      price_minor: 500_000,
      currency: "RUB",
      message: "Уже отправленное предложение достаточной длины.",
      status: "pending",
      expires_at: "2027-01-01T00:00:00.000Z",
    };
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });
    const guideSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { verification_status: "approved", is_available: true },
        }),
      }),
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existingOffer }),
            }),
          }),
        }),
      }),
    });
    const requestSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            traveler_id: "trav-1",
            destination: "Казань",
            region: "Татарстан",
            starts_on: "2026-09-10",
            start_time: "10:00:00",
            end_time: "13:00:00",
            date_flexibility: "exact",
          },
        }),
      }),
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_profiles") return { select: guideSelect };
        if (table === "guide_offers") return { select: offerSelect };
        if (table === "traveler_requests") return { select: requestSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const result = await submitOfferAction("request-1", new FormData());

    expect(result).toEqual({ ok: true, alreadyOffered: true });
    expect(ensureOfferConversationMock).toHaveBeenCalledWith({
      offer: existingOffer,
      guideId: "guide-1",
      travelerId: "trav-1",
      request: expect.objectContaining({ destination: "Казань" }),
    });
  });

  it("rejects an offer whose interval overlaps the guide's own calendar block", async () => {
    isGuideIntervalBlocked.mockResolvedValueOnce(true);

    const guideMaybeSingle = vi.fn().mockResolvedValue({
      data: { verification_status: "approved", is_available: true },
    });
    const guideSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: guideMaybeSingle }),
    });
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });
    // findGuideOfferOnRequest: select("*").eq().eq().order().limit().maybeSingle() → not offered yet.
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
          }),
        }),
      }),
    });
    const requestSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            status: "open",
            traveler_id: "trav-1",
            date_locked: false,
            time_locked: false,
            starts_on: "2026-09-10",
            start_time: null,
            end_time: null,
            date_flexibility: "exact",
          },
        }),
      }),
    });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      if (table === "guide_profiles") return { select: guideSelect };
      if (table === "guide_offers") return { select: offerSelect };
      if (table === "traveler_requests") return { select: requestSelect };
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
      },
      from,
    });

    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "предложение достаточной длины для валидации");
    fd.set("valid_until", "2027-01-01");
    fd.set("starts_at", "2026-09-10T07:00:00.000Z");
    fd.set("ends_at", "2026-09-10T10:00:00.000Z");

    const result = await submitOfferAction("11111111-1111-4111-8111-111111111111", fd);

    expect(result).toEqual({
      error: "Этот период закрыт в вашем календаре. Откройте его в профиле или предложите другое время.",
    });
    expect(isGuideIntervalBlocked).toHaveBeenCalledWith(
      "guide-1",
      "2026-09-10T07:00:00.000Z",
      "2026-09-10T10:00:00.000Z",
    );
  });
});

describe("withdrawOfferAction", () => {
  it("sets a pending owned offer to withdrawn", async () => {
    const offerMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "offer-1", guide_id: "guide-1", status: "pending", request_id: "req-1" },
    });
    const offerSelectEq = vi.fn().mockReturnValue({ maybeSingle: offerMaybeSingle });
    const offerSelect = vi.fn().mockReturnValue({ eq: offerSelectEq });

    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "offer-1" }, error: null }),
            }),
          }),
        }),
      }),
    });

    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { account_status: "active" } });
    const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      if (table === "guide_offers") return { select: offerSelect, update };
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
      },
      from,
    });

    const result = await withdrawOfferAction("offer-1", "req-1");

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "withdrawn" }),
    );
  });

  it("reports a conflict when the offer stopped being pending mid-flight", async () => {
    // Traveler accepts between the status read and the write: the conditional
    // update matches zero rows and must not report success.
    const offerMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "offer-1", guide_id: "guide-1", status: "pending", request_id: "req-1" },
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: offerMaybeSingle }),
    });

    const updateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateSelect = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
    const statusEq = vi.fn().mockReturnValue({ select: updateSelect });
    const guideEq = vi.fn().mockReturnValue({ eq: statusEq });
    const idEq = vi.fn().mockReturnValue({ eq: guideEq });
    const update = vi.fn().mockReturnValue({ eq: idEq });

    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_offers") return { select: offerSelect, update };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const result = await withdrawOfferAction("offer-1", "req-1");

    expect(statusEq).toHaveBeenCalledWith("status", "pending");
    expect(result).toEqual({ error: "Можно отозвать только активное предложение." });
  });
});

describe("editOfferAction", () => {
  it("rejects a changed date for exact requests even when date_locked=false", async () => {
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }) }),
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "offer-1", guide_id: "guide-1", status: "pending", request_id: "req-1" },
      }) }),
    });
    const requestSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { ...baseRequest, traveler_id: "trav-1", date_locked: false } }),
      }),
    });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_offers") return { select: offerSelect };
        if (table === "traveler_requests") return { select: requestSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });
    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "обновлённое предложение достаточной длины");
    fd.set("valid_until", "2027-01-01");
    fd.set("starts_at", makeIso("2026-09-11", "10:00"));
    fd.set("ends_at", makeIso("2026-09-11", "13:00"));

    await expect(editOfferAction("offer-1", "11111111-1111-4111-8111-111111111111", fd)).resolves.toEqual({
      error: "Путешественник просит строго эту дату.",
    });
  });

  it("rejects when the offer is not pending", async () => {
    const offerMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "offer-1", guide_id: "guide-1", status: "accepted", request_id: "req-1" },
    });
    const offerSelectEq = vi.fn().mockReturnValue({ maybeSingle: offerMaybeSingle });
    const offerSelect = vi.fn().mockReturnValue({ eq: offerSelectEq });
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { account_status: "active" } });
    const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profileSelect };
      if (table === "guide_offers") return { select: offerSelect };
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
      },
      from,
    });

    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "обновлённое предложение достаточной длины");
    fd.set("valid_until", "2027-01-01");

    const res = await editOfferAction("offer-1", "req-1", fd);

    expect("error" in res).toBe(true);
  });

  it("reports a conflict when the offer stopped being pending mid-flight", async () => {
    const offerMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "offer-1", guide_id: "guide-1", status: "pending", request_id: "req-1" },
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: offerMaybeSingle }),
    });

    const updateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateSelect = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
    const statusEq = vi.fn().mockReturnValue({ select: updateSelect });
    const guideEq = vi.fn().mockReturnValue({ eq: statusEq });
    const idEq = vi.fn().mockReturnValue({ eq: guideEq });
    const update = vi.fn().mockReturnValue({ eq: idEq });

    const requestSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { ...baseRequest, traveler_id: "trav-1" },
        }),
      }),
    });

    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_offers") return { select: offerSelect, update };
        if (table === "traveler_requests") return { select: requestSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "обновлённое предложение достаточной длины");
    fd.set("valid_until", "2027-01-01");
    fd.set("starts_at", makeIso("2026-09-10", "10:00"));
    fd.set("ends_at", makeIso("2026-09-10", "13:00"));

    const result = await editOfferAction("offer-1", "11111111-1111-4111-8111-111111111111", fd);

    expect(statusEq).toHaveBeenCalledWith("status", "pending");
    expect(result).toEqual({ error: "Можно редактировать только активное предложение." });
  });

  it("reports not found when the offer does not exist", async () => {
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
    });
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_offers") return { select: offerSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "обновлённое предложение достаточной длины");
    fd.set("valid_until", "2027-01-01");

    const result = await editOfferAction("missing-offer", "req-1", fd);

    expect(result).toEqual({ error: "Предложение не найдено." });
  });

  it("rejects editing an offer owned by another guide", async () => {
    const offerMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "offer-1", guide_id: "other-guide", status: "pending", request_id: "req-1" },
    });
    const offerSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: offerMaybeSingle }),
    });
    const profileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { account_status: "active" } }),
      }),
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return { select: profileSelect };
        if (table === "guide_offers") return { select: offerSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const fd = new FormData();
    fd.set("price_total", "5000");
    fd.set("message", "обновлённое предложение достаточной длины");
    fd.set("valid_until", "2027-01-01");

    const result = await editOfferAction("offer-1", "req-1", fd);

    expect(result).toEqual({ error: "Это не ваше предложение." });
  });
});
