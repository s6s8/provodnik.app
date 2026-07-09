import { describe, it, expect, vi } from "vitest";

const { createOwnBlock, softDeleteOwnBlock } = vi.hoisted(() => ({
  createOwnBlock: vi.fn(async () => ({ overlappingCommitments: 0 })),
  softDeleteOwnBlock: vi.fn(async () => undefined),
}));
vi.mock("@/lib/supabase/guide-availability-blocks", () => ({ createOwnBlock, softDeleteOwnBlock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createAvailabilityBlockAction,
  deleteAvailabilityBlockAction,
} from "./availabilityBlocks";

describe("createAvailabilityBlockAction", () => {
  it("creates a whole-day block and passes validated input to the service", async () => {
    const res = await createAvailabilityBlockAction({ kind: "day", date: "2026-07-10" });
    expect(res).toEqual({ ok: true });
    expect(createOwnBlock).toHaveBeenCalledWith({ kind: "day", date: "2026-07-10" });
  });

  it("rejects invalid input without touching the service", async () => {
    createOwnBlock.mockClear();
    const res = await createAvailabilityBlockAction({
      kind: "window",
      startDate: "2026-07-10",
      endDate: "2026-07-10",
      startTime: "18:00",
      endTime: "14:00",
    });
    expect(res.ok).toBe(false);
    expect(createOwnBlock).not.toHaveBeenCalled();
  });

  it("surfaces a warning when the closed period overlaps existing commitments", async () => {
    createOwnBlock.mockResolvedValueOnce({ overlappingCommitments: 2 });
    const res = await createAvailabilityBlockAction({ kind: "day", date: "2026-07-10" });
    expect(res.ok).toBe(true);
    expect(res.ok && res.warning).toBeTruthy();
  });

  it("accepts a time-window date range", async () => {
    createOwnBlock.mockClear();
    const res = await createAvailabilityBlockAction({
      kind: "window",
      startDate: "2026-07-01",
      endDate: "2026-07-20",
      startTime: "15:00",
      endTime: "20:00",
    });
    expect(res).toEqual({ ok: true });
    expect(createOwnBlock).toHaveBeenCalledWith({
      kind: "window",
      startDate: "2026-07-01",
      endDate: "2026-07-20",
      startTime: "15:00",
      endTime: "20:00",
    });
  });

  it("returns the ActionError message when the service throws one", async () => {
    const { ActionError } = await import("@/lib/actions/create-action");
    createOwnBlock.mockRejectedValueOnce(new ActionError("Требуется вход"));
    expect(await createAvailabilityBlockAction({ kind: "day", date: "2026-07-10" })).toEqual({
      ok: false,
      error: "Требуется вход",
    });
  });
});

describe("deleteAvailabilityBlockAction", () => {
  it("soft-deletes the block by id", async () => {
    expect(await deleteAvailabilityBlockAction("block-1")).toEqual({ ok: true });
    expect(softDeleteOwnBlock).toHaveBeenCalledWith("block-1");
  });
});
