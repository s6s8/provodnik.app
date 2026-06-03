import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/bookings/state-machine", () => ({
  transitionBooking: vi.fn(),
}));
vi.mock("@/lib/notifications/triggers", () => ({
  notifyDisputeOpened: vi.fn(),
}));
vi.mock("@/lib/profile/resolve-display-name", () => ({
  resolveDisplayName: vi.fn(() => "Гид"),
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));

import { getDisputes } from "@/lib/supabase/disputes";

describe("getDisputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an admin session before listing disputes", async () => {
    requireAdminSession.mockRejectedValue(new Error("Доступ только для администраторов."));

    await expect(getDisputes()).rejects.toThrow("Доступ только для администраторов.");
  });

  it("uses the admin client returned by requireAdminSession", async () => {
    const query = {
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
    const adminClient = {
      from: vi.fn(() => query),
    };
    requireAdminSession.mockResolvedValue({ adminClient });

    await expect(getDisputes()).resolves.toEqual([]);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(adminClient.from).toHaveBeenCalledWith("disputes");
  });
});
