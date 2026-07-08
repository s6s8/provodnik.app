import { describe, it, expect, vi } from "vitest";

const { setOwnAvailability } = vi.hoisted(() => ({
  setOwnAvailability: vi.fn(async () => undefined),
}));
vi.mock("@/lib/supabase/availability", () => ({ setOwnAvailability }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { setGuideAvailabilityAction } from "./setAvailability";

describe("setGuideAvailabilityAction", () => {
  it("returns ok on success", async () => {
    expect(await setGuideAvailabilityAction(false)).toEqual({ ok: true });
    expect(setOwnAvailability).toHaveBeenCalledWith(false);
  });

  it("returns error text when the service throws ActionError", async () => {
    const { ActionError } = await import("@/lib/actions/create-action");
    setOwnAvailability.mockRejectedValueOnce(new ActionError("Требуется вход"));
    expect(await setGuideAvailabilityAction(true)).toEqual({
      ok: false,
      error: "Требуется вход",
    });
  });
});
