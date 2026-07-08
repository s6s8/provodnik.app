import { describe, it, expect, vi, beforeEach } from "vitest";

const updateEq = vi.fn(() => ({ error: null }));
const insert = vi.fn(() => ({ error: null }));
const from = vi.fn((table: string) =>
  table === "guide_profiles"
    ? { update: () => ({ eq: updateEq }) }
    : { insert },
);
const getUser = vi.fn(async () => ({ data: { user: { id: "g1" } }, error: null }));

vi.mock("./server", () => ({
  createSupabaseServerClient: async () => ({ from, auth: { getUser } }),
}));
vi.mock("./admin", () => ({ createSupabaseAdminClient: () => ({ from }) }));

import { setOwnAvailability, setGuideAvailabilityByAdmin } from "./availability";

beforeEach(() => {
  updateEq.mockClear();
  insert.mockClear();
});

describe("availability service", () => {
  it("guide self-pause updates own row and logs a guide event", async () => {
    await setOwnAvailability(false);
    expect(updateEq).toHaveBeenCalledWith("user_id", "g1");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        guide_id: "g1",
        actor_id: "g1",
        actor_role: "guide",
        available: false,
      }),
    );
  });

  it("admin override updates target row and logs an admin event", async () => {
    await setGuideAvailabilityByAdmin("g2", true, "admin1");
    expect(updateEq).toHaveBeenCalledWith("user_id", "g2");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        guide_id: "g2",
        actor_id: "admin1",
        actor_role: "admin",
        available: true,
      }),
    );
  });

  it("throws when guide is unauthenticated", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null } as never);
    await expect(setOwnAvailability(true)).rejects.toThrow("Требуется вход");
  });
});
