import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  hasSupabaseEnvMock,
  readAuthContextFromServerMock,
  redirectMock,
} = vi.hoisted(() => ({
  hasSupabaseEnvMock: vi.fn(),
  readAuthContextFromServerMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/features/notifications/components/notification-center-screen", () => ({
  NotificationCenterScreen: () => <div>Notification center</div>,
}));

import NotificationsPage from "./page";

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
  });

  it("redirects unauthenticated users to auth with the notifications return path", async () => {
    readAuthContextFromServerMock.mockResolvedValue({
      isAuthenticated: false,
      role: null,
      userId: null,
    });

    await NotificationsPage();

    expect(readAuthContextFromServerMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/auth?next=/notifications");
  });
});
