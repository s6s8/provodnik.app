import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  ensureOpenModerationCaseMock,
  performModerationActionMock,
  requireAdminSessionMock,
} = vi.hoisted(() => ({
  ensureOpenModerationCaseMock: vi.fn(),
  performModerationActionMock: vi.fn(),
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  ensureOpenModerationCase: ensureOpenModerationCaseMock,
  performModerationAction: performModerationActionMock,
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { approveGuide, rejectGuide } from "./actions";

describe("guide approval actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureOpenModerationCaseMock.mockResolvedValue({ id: "case-1" });
    performModerationActionMock.mockResolvedValue({ id: "action-1" });
  });

  it("approveGuide completes for an admin session", async () => {
    requireAdminSessionMock.mockResolvedValue({ adminId: "admin-1" });

    const result = await approveGuide("guide-1", { error: null }, new FormData());

    expect(result).toEqual({ error: null, success: "Гид одобрен" });
    expect(performModerationActionMock).toHaveBeenCalledWith(
      "case-1",
      "admin-1",
      "approve",
    );
  });

  it("rejectGuide returns an error when the session is not admin", async () => {
    requireAdminSessionMock.mockRejectedValue(
      new Error("Доступ только для администраторов."),
    );

    const result = await rejectGuide("guide-1", { error: null }, new FormData());

    expect(result.error).toBe("Доступ только для администраторов.");
    expect(performModerationActionMock).not.toHaveBeenCalled();
  });
});
