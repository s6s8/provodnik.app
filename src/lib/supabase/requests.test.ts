import { beforeEach, describe, expect, it, vi } from "vitest";

// Item 8 / D17-8: target_guide_id is the privacy authority for a directed request, and
// choosing it is the database's authority, not the caller's. This client writes with the
// browser's own session, so RLS forbids a non-null target on a direct insert; a directed
// request must go through create_directed_traveler_request, which derives the addressee
// from a published listing or an approved guide slug and fails closed if it cannot.
const { createSupabaseServerClient, insertSingle, rpcSpy, insertSpy } = vi.hoisted(
  () => {
    const insertSingle = vi.fn();
    const insertSpy = vi.fn(() => ({ select: () => ({ single: insertSingle }) }));
    const rpcSpy = vi.fn();
    const fromSpy = vi.fn((table: string) => {
      if (table === "traveler_requests") {
        return { insert: insertSpy };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    return {
      createSupabaseServerClient: vi.fn(async () => ({ from: fromSpy, rpc: rpcSpy })),
      insertSingle,
      rpcSpy,
      insertSpy,
    };
  },
);

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { createTravelerRequest } from "./requests";

const travelerId = "11111111-1111-4111-8111-111111111111";
const guideUserId = "22222222-2222-4222-8222-222222222222";
const listingId = "33333333-3333-4333-8333-333333333333";

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
    insertSingle.mockResolvedValue({ data: { id: "request-1" }, error: null });
    rpcSpy.mockResolvedValue({ data: { id: "request-1", target_guide_id: guideUserId }, error: null });
  });

  it("derives a listing-started request's addressee in the database, not the client", async () => {
    await createTravelerRequest({ ...base, listing_id: listingId }, travelerId);

    expect(rpcSpy).toHaveBeenCalledWith(
      "create_directed_traveler_request",
      expect.objectContaining({ p_listing_id: listingId, p_destination: base.destination }),
    );
    // The privileged column is never written by this client.
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("routes a named guide slug through the same server-side resolution", async () => {
    await createTravelerRequest({ ...base, preferred_guide_slug: "real-guide" }, travelerId);

    expect(rpcSpy).toHaveBeenCalledWith(
      "create_directed_traveler_request",
      expect.objectContaining({ p_preferred_guide_slug: "real-guide", p_listing_id: null }),
    );
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("fails closed when the database cannot resolve the named guide (no public downgrade)", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: "target_guide_unresolved" } });

    await expect(
      createTravelerRequest({ ...base, preferred_guide_slug: "ghost-guide" }, travelerId),
    ).rejects.toMatchObject({ message: "target_guide_unresolved" });

    // No fallback: a directed request is never persisted as a public fan-out one.
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("leaves an ordinary open request undirected", async () => {
    await createTravelerRequest(base, travelerId);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        target_guide_id: null,
        preferred_guide_slug: null,
        traveler_id: travelerId,
      }),
    );
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("ignores a caller-supplied target_guide_id instead of writing it", async () => {
    await createTravelerRequest(
      { ...base, target_guide_id: guideUserId } as never,
      travelerId,
    );

    expect(rpcSpy).not.toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ target_guide_id: null }),
    );
  });
});
