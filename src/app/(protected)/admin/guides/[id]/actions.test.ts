import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  ensureOpenModerationCaseMock,
  performModerationActionMock,
  requireAdminSessionMock,
  setGuideAvailabilityByAdminMock,
} = vi.hoisted(() => ({
  ensureOpenModerationCaseMock: vi.fn(),
  performModerationActionMock: vi.fn(),
  requireAdminSessionMock: vi.fn(),
  setGuideAvailabilityByAdminMock: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  ensureOpenModerationCase: ensureOpenModerationCaseMock,
  performModerationAction: performModerationActionMock,
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/lib/supabase/availability", () => ({
  setGuideAvailabilityByAdmin: setGuideAvailabilityByAdminMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { approveGuide, rejectGuide, setGuideAvailability } from "./actions";

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

  it("setGuideAvailability calls the admin service with the resolved admin id", async () => {
    requireAdminSessionMock.mockResolvedValue({ adminId: "admin-1" });

    const result = await setGuideAvailability("g2", false, { error: null }, new FormData());

    expect(setGuideAvailabilityByAdminMock).toHaveBeenCalledWith("g2", false, "admin-1");
    expect(result.error).toBeNull();
    expect(result.success).toBe("Приём заявок приостановлен.");
  });

  it("setGuideAvailability returns an error when the service throws", async () => {
    requireAdminSessionMock.mockResolvedValue({ adminId: "admin-1" });
    setGuideAvailabilityByAdminMock.mockRejectedValueOnce(new Error("db down"));

    const result = await setGuideAvailability("g2", true, { error: null }, new FormData());

    expect(result.error).toBe("Не удалось изменить доступность гида.");
  });
});
