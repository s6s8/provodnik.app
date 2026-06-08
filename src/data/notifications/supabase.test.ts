import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationRow } from "@/lib/supabase/types";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import {
  listNotificationsForCurrentUserFromSupabase,
  markNotificationReadInSupabase,
} from "./supabase";

const userId = "22222222-2222-4222-8222-222222222222";
const notificationId = "33333333-3333-4333-8333-333333333333";
const createdAt = "2026-06-08T10:00:00.000Z";
const readAt = "2026-06-08T12:00:00.000Z";

function createNotificationRow(overrides: Partial<NotificationRow>): NotificationRow {
  return {
    id: notificationId,
    user_id: userId,
    kind: "admin_alert",
    title: "Notification",
    body: null,
    href: null,
    channel: "inbox",
    status: null,
    is_read: false,
    created_at: createdAt,
    read_at: null,
    payload: null,
    ...overrides,
  };
}

function createNotificationListClient(rows: NotificationRow[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from,
    },
    from,
    select,
    eq,
    order,
  };
}

function createNotificationUpdateClient() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: notificationId }, error: null });
  const select = vi.fn(() => ({ maybeSingle }));
  const userEq = vi.fn(() => ({ select }));
  const idEq = vi.fn(() => ({ eq: userEq }));
  const update = vi.fn(() => ({ eq: idEq }));
  const from = vi.fn(() => ({ update }));

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from,
    },
    from,
    update,
    idEq,
    userEq,
    select,
    maybeSingle,
  };
}

describe("listNotificationsForCurrentUserFromSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps a read notification readAt from read_at instead of created_at", async () => {
    const supabase = createNotificationListClient([
      createNotificationRow({ is_read: true, read_at: readAt }),
    ]);
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    const notifications = await listNotificationsForCurrentUserFromSupabase();

    expect(notifications[0]?.readAt).toBe(readAt);
    expect(notifications[0]?.readAt).not.toBe(createdAt);
  });

  it("maps an unread notification readAt to null", async () => {
    const supabase = createNotificationListClient([
      createNotificationRow({ is_read: false, read_at: readAt }),
    ]);
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    const notifications = await listNotificationsForCurrentUserFromSupabase();

    expect(notifications[0]?.readAt).toBeNull();
  });

  it("selects read_at from notifications", async () => {
    const supabase = createNotificationListClient([]);
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    await listNotificationsForCurrentUserFromSupabase();

    expect(supabase.select).toHaveBeenCalledWith(expect.stringContaining("read_at"));
  });
});

describe("markNotificationReadInSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the update to the authenticated user's notification", async () => {
    const supabase = createNotificationUpdateClient();
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    await markNotificationReadInSupabase(notificationId);

    expect(supabase.from).toHaveBeenCalledWith("notifications");
    expect(supabase.idEq).toHaveBeenCalledWith("id", notificationId);
    expect(supabase.userEq).toHaveBeenCalledWith("user_id", userId);
  });

  it("rejects when the scoped update returns no updated row", async () => {
    const supabase = createNotificationUpdateClient();
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    await expect(markNotificationReadInSupabase(notificationId)).rejects.toThrow(
      "Notification not found or not accessible.",
    );
  });
});
