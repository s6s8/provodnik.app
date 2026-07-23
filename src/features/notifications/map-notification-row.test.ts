import { describe, expect, it } from "vitest";

import { mapNotificationRow } from "./map-notification-row";

const createdAt = "2026-06-08T10:00:00.000Z";
const readAt = "2026-06-08T12:00:00.000Z";

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: "22222222-2222-4222-8222-222222222222",
    kind: "admin_alert",
    title: "Notification",
    body: "Body",
    href: null,
    status: "sent",
    read_at: null,
    created_at: createdAt,
    ...overrides,
  };
}

describe("mapNotificationRow", () => {
  it("maps a read notification readAt from read_at instead of created_at", () => {
    const notification = mapNotificationRow(
      createRow({ status: "read", read_at: readAt }),
    );

    expect(notification.readAt).toBe(readAt);
    expect(notification.readAt).not.toBe(createdAt);
  });

  it("maps an unread notification readAt to null even when read_at is present", () => {
    const notification = mapNotificationRow(
      createRow({ status: "sent", read_at: readAt }),
    );

    expect(notification.readAt).toBeNull();
  });
});
