import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useUnreadCountMock } = vi.hoisted(() => ({
  useUnreadCountMock: vi.fn(() => ({ unreadCount: 0, refetch: vi.fn() })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/guide",
}));

vi.mock("@/features/messaging/hooks/use-unread-count", () => ({
  useUnreadCount: useUnreadCountMock,
}));

import { GuideBottomNav } from "./guide-bottom-nav";

describe("GuideBottomNav", () => {
  it("passes auth state into unread message loading", () => {
    render(<GuideBottomNav isAuthenticated={false} />);

    expect(useUnreadCountMock).toHaveBeenCalledWith(false);
  });
});
