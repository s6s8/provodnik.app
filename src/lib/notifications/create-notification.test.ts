import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient, hasSupabaseAdminEnv } = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseAdminEnv,
}));

import { createNotification } from "@/lib/notifications/create-notification";

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseAdminEnv.mockReturnValue(true);
  });

  it("writes through the admin client so cross-user inserts are not blocked by RLS", async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "notif-1",
            user_id: "22222222-2222-4222-8222-222222222222",
            kind: "new_offer",
            title: "Новое предложение",
            body: null,
            href: "/traveler/requests/req-1",
            is_read: false,
            created_at: "2026-06-02T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    });

    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert })),
    });

    await createNotification({
      userId: "22222222-2222-4222-8222-222222222222",
      kind: "new_offer",
      title: "Новое предложение",
      href: "/traveler/requests/req-1",
    });

    expect(createSupabaseAdminClient).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "22222222-2222-4222-8222-222222222222",
        kind: "new_offer",
        channel: "inbox",
        status: "unread",
      }),
    );
  });

  it("throws when admin credentials are missing instead of falling back to the session client", async () => {
    hasSupabaseAdminEnv.mockReturnValue(false);

    await expect(
      createNotification({
        userId: "22222222-2222-4222-8222-222222222222",
        kind: "new_offer",
        title: "Новое предложение",
      }),
    ).rejects.toThrow(/SUPABASE_SECRET_KEY/);

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
