import { describe, expect, it, vi } from "vitest";

import type { TravelerRequest } from "@/data/traveler-request/schema";

vi.mock("@/lib/notifications/triggers", () => ({
  notifyGuidesNewRequest: vi.fn(),
}));

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
}));
vi.mock("@/lib/env", () => ({ hasSupabaseEnv: () => true }));

const { createTravelerRequestMock } = vi.hoisted(() => ({
  createTravelerRequestMock: vi.fn(),
}));
vi.mock("@/lib/supabase/requests", () => ({
  createTravelerRequest: createTravelerRequestMock,
}));
vi.mock("@/lib/analytics/marketplace-events", () => ({ logFunnelEvent: vi.fn() }));

// In production `after()` runs inside the Server Action's request scope; under
// the unit runner there is no such scope, so run the callback inline instead.
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => {
    void callback();
  },
}));

import { buildRequestInsertPayload, createRequestAction } from "./create-request-actions";

const baseInput: TravelerRequest = {
  mode: "private",
  interests: ["history_culture"],
  destination: "Элиста",
  startDate: "2026-09-10",
  dateFlexibility: "exact",
  startTime: "",
  endTime: "",
  groupSize: 4,
  groupSizeCurrent: undefined,
  groupMax: undefined,
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 5000,
  requestedLanguages: [],
  notes: "",
};

describe("buildRequestInsertPayload", () => {
  it("writes date_locked=false, time_locked=false when allowGuideSuggestions=true", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload.date_locked).toBe(false);
    expect(payload.time_locked).toBe(false);
  });

  it("writes date_locked=true, time_locked=true when allowGuideSuggestions=false", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: false });

    expect(payload.date_locked).toBe(true);
    expect(payload.time_locked).toBe(true);
  });

  it("carries the ready excursion through to the service as a derivation source", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, guideTemplateId: "44444444-4444-4444-8444-444444444444" },
      { allowGuideSuggestions: true },
    );

    expect(payload.guide_template_id).toBe("44444444-4444-4444-8444-444444444444");
    // The programme is never authored here — the database reads it off the template.
    expect(payload).not.toHaveProperty("guide_template_snapshot");
  });

  it("leaves an ordinary request template-null", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload.guide_template_id).toBeNull();
  });

  it("does not include allow_guide_suggestions in the payload", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload).not.toHaveProperty("allow_guide_suggestions");
  });

  it("does not include group_capacity in the payload", async () => {
    const payload = await buildRequestInsertPayload(
      {
        ...baseInput,
        mode: "assembly",
        groupSizeCurrent: 2,
        groupMax: 6,
        groupSize: undefined,
      },
      { allowGuideSuggestions: false },
    );

    expect(payload).not.toHaveProperty("group_capacity");
  });

  it("rubToKopecks conversion is applied to budget_minor", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, budgetPerPersonRub: 5000 },
      { allowGuideSuggestions: false },
    );

    expect(payload.budget_minor).toBe(500_000);
  });

  it("passes requested_languages through to the insert payload", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, requestedLanguages: ["Хинди", "Английский"] },
      { allowGuideSuggestions: true },
    );
    expect(payload.requested_languages).toEqual(["Хинди", "Английский"]);
  });

  it("defaults requested_languages to [] when omitted", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });
    expect(payload.requested_languages).toEqual([]);
  });

  it("persists the real ends_on from endDate when provided", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, startDate: "2026-08-01", endDate: "2026-08-07" },
      { allowGuideSuggestions: true },
    );

    expect(payload.starts_on).toBe("2026-08-01");
    expect(payload.ends_on).toBe("2026-08-07");
  });

  it("falls back ends_on to startDate when endDate is absent", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, startDate: "2026-08-01", endDate: undefined },
      { allowGuideSuggestions: true },
    );

    expect(payload.ends_on).toBe("2026-08-01");
  });

  it("persists preferred_guide_slug from the guide-page CTA", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, preferredGuideSlug: "жюль-верников-69f18040" },
      { allowGuideSuggestions: true },
    );

    expect(payload.preferred_guide_slug).toBe("жюль-верников-69f18040");
  });

  it("writes preferred_guide_slug as null when no guide was preselected", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload.preferred_guide_slug).toBeNull();
  });
});

function validRequestFormData(): FormData {
  const fd = new FormData();
  fd.set("mode", "private");
  fd.append("interests[]", "history_culture");
  fd.set("destination", "Элиста");
  fd.set("startDate", "2026-09-10");
  fd.set("dateFlexibility", "exact");
  fd.set("startTime", "10:00");
  fd.set("endTime", "12:00");
  fd.set("groupSize", "4");
  fd.set("budgetPerPersonRub", "5000");
  return fd;
}

describe("createRequestAction — flexibility is not silently locked (#owner609)", () => {
  it("persists date_locked=false and time_locked=false when the form omits allowGuideSuggestions", async () => {
    createTravelerRequestMock.mockClear();
    createTravelerRequestMock.mockResolvedValue({ id: "req-1" });
    // Active signed-in traveler; profile lookup returns active.
    getUserMock.mockResolvedValue({ data: { user: { id: "trav-1" } }, error: null });
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    (createSupabaseServerClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: getUserMock },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { account_status: "active" }, error: null }) }),
        }),
      }),
    });

    // validRequestFormData() never sets "allowGuideSuggestions" — the exact bug input.
    // A successful create ends in redirect() (throws NEXT_REDIRECT); swallow it.
    await createRequestAction({ error: null }, validRequestFormData()).catch((e) => {
      if (!(e instanceof Error) || !e.message.includes("NEXT_REDIRECT")) throw e;
    });

    expect(createTravelerRequestMock).toHaveBeenCalledTimes(1);
    const payload = createTravelerRequestMock.mock.calls[0][0] as {
      date_flexibility: "exact" | "few_days";
      date_locked: boolean;
      time_locked: boolean;
    };
    expect(payload.date_flexibility).toBe("exact");
    expect(payload.date_locked).toBe(false);
    expect(payload.time_locked).toBe(false);
  });
});

describe("createRequestAction — auth gating (#34)", () => {
  it("returns code 'auth_required' when the server sees no signed-in user", async () => {
    // Server is authoritative: no browser getUser() pre-check. When getUser
    // resolves without a user, the action signals auth_required so the client
    // gates to login only on real, server-confirmed auth failure.
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await createRequestAction({ error: null }, validRequestFormData());

    expect(result.code).toBe("auth_required");
    expect(result.error).toBeTruthy();
  });

  it("returns code 'auth_required' when getUser throws (mid-refresh token)", async () => {
    getUserMock.mockRejectedValueOnce(new Error("token refresh in flight"));

    const result = await createRequestAction({ error: null }, validRequestFormData());

    expect(result.code).toBe("auth_required");
  });
});
