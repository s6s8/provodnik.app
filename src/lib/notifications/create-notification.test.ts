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
            href: "/requests/req-1",
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
      href: "/requests/req-1",
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

  it("returns created=false when the persistence guard already stored the notification", async () => {
    const existingRow = {
      id: "notif-1",
      user_id: "22222222-2222-4222-8222-222222222222",
      kind: "new_offer",
      title: "Новое предложение",
      body: null,
      href: "/requests/req-1?offer=offer-1",
      is_read: false,
      created_at: "2026-06-02T00:00:00.000Z",
    };

    const maybeSingle = vi.fn().mockResolvedValue({ data: existingRow, error: null });
    const entityEq = { maybeSingle };
    const kindEq = { eq: vi.fn().mockReturnValue(entityEq) };
    const userEq = { eq: vi.fn().mockReturnValue(kindEq) };
    const selectRoot = { eq: vi.fn().mockReturnValue(userEq) };
    const select = vi.fn().mockReturnValue(selectRoot);
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "duplicate key value" },
        }),
      }),
    });

    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert, select })),
    });

    const result = await createNotification({
      userId: "22222222-2222-4222-8222-222222222222",
      kind: "new_offer",
      title: "Новое предложение",
      href: "/requests/req-1?offer=offer-1",
      entityType: "offer",
      entityId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result.created).toBe(false);
    expect(result.row).toEqual(existingRow);
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
