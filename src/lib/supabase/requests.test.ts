import { beforeEach, describe, expect, it, vi } from "vitest";

// Item 8 / D17-8: target_guide_id is the privacy authority for a directed request.
// It must be resolvable from a server-trusted guide id (listing CTA) as well as from
// the legacy display-only slug — and an unresolvable named guide must fail closed
// instead of silently persisting a public fan-out request.
const { createSupabaseServerClient, guideMaybeSingle, insertSingle, fromSpy, insertSpy } =
  vi.hoisted(() => {
    const guideMaybeSingle = vi.fn();
    const insertSingle = vi.fn();
    const insertSpy = vi.fn(() => ({ select: () => ({ single: insertSingle }) }));
    const fromSpy = vi.fn((table: string) => {
      if (table === "guide_profiles") {
        return { select: () => ({ eq: () => ({ maybeSingle: guideMaybeSingle }) }) };
      }
      if (table === "traveler_requests") {
        return { insert: insertSpy };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    return {
      createSupabaseServerClient: vi.fn(async () => ({ from: fromSpy })),
      guideMaybeSingle,
      insertSingle,
      fromSpy,
      insertSpy,
    };
  });

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { createTravelerRequest } from "./requests";

const travelerId = "11111111-1111-4111-8111-111111111111";
const guideUserId = "22222222-2222-4222-8222-222222222222";

const base = {
  destination: "Экскурсия по Элисте",
  region: "Калмыкия",
  interests: ["history_culture"],
  starts_on: "2026-06-10",
  ends_on: "2026-06-10",
  participants_count: 2,
};

describe("createTravelerRequest — directed request target", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guideMaybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({ data: { id: "request-1" }, error: null });
  });

  it("persists a server-trusted target_guide_id without trusting a slug", async () => {
    await createTravelerRequest({ ...base, target_guide_id: guideUserId }, travelerId);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ target_guide_id: guideUserId, traveler_id: travelerId }),
    );
    // No slug involved → no guide lookup needed.
    expect(fromSpy).not.toHaveBeenCalledWith("guide_profiles");
  });

  it("fails closed when a named guide slug cannot be resolved (no public downgrade)", async () => {
    await expect(
      createTravelerRequest({ ...base, preferred_guide_slug: "ghost-guide" }, travelerId),
    ).rejects.toThrow("target_guide_unresolved");

    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("still resolves the legacy slug to a real FK when the guide exists", async () => {
    guideMaybeSingle.mockResolvedValue({ data: { user_id: guideUserId }, error: null });

    await createTravelerRequest({ ...base, preferred_guide_slug: "real-guide" }, travelerId);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ target_guide_id: guideUserId, preferred_guide_slug: "real-guide" }),
    );
  });

  it("leaves an ordinary open request undirected", async () => {
    await createTravelerRequest(base, travelerId);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ target_guide_id: null, preferred_guide_slug: null }),
    );
  });
});
