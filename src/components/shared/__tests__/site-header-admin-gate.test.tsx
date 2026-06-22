import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";
const { useUnreadCountMock } = vi.hoisted(() => ({
  useUnreadCountMock: vi.fn(() => ({
    unreadCount: 0,
    refetch: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/features/messaging/hooks/use-unread-count", () => ({
  useUnreadCount: useUnreadCountMock,
}));

import { SiteHeader } from "../site-header";

function adminLinks() {
  return screen
    .queryAllByRole("link")
    .filter((link) => link.getAttribute("href")?.startsWith("/admin"));
}

describe("SiteHeader admin nav gate (GAP-1 / home:P2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
  });

  it("does not expose «Админка» / /admin links to anonymous visitors", () => {
    render(<SiteHeader role={null} />);

    expect(screen.queryByText("Админка")).not.toBeInTheDocument();
    expect(adminLinks()).toHaveLength(0);
  });

  it("does not expose «Админка» / /admin links to travelers", () => {
    render(
      <SiteHeader isAuthenticated role="traveler" email="traveler@example.com" userId="user-1" />,
    );

    expect(screen.queryByText("Админка")).not.toBeInTheDocument();
    expect(adminLinks()).toHaveLength(0);
  });

  it("does not expose «Админка» / /admin links to guides", () => {
    render(
      <SiteHeader isAuthenticated role="guide" email="guide@example.com" userId="user-2" />,
    );

    expect(screen.queryByText("Админка")).not.toBeInTheDocument();
    expect(adminLinks()).toHaveLength(0);
  });

  it("renders the «Админка» nav link for admins", () => {
    render(
      <SiteHeader isAuthenticated role="admin" email="admin@example.com" userId="user-3" />,
    );

    const links = screen.getAllByRole("link", { name: "Админка" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/admin/dashboard");
    }
  });
});
