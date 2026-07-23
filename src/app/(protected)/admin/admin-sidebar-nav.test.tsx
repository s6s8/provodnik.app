import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(() => "/admin/dashboard"),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

import { AdminMobileTabs, AdminSidebarNav } from "./admin-sidebar-nav";

function getModerationSidebarLink() {
  const nav = screen.getByRole("navigation", { name: "Admin workspace" });
  const link = nav.querySelector('a[href="/admin/moderation"]');
  if (!link) {
    throw new Error("Moderation sidebar link not found");
  }
  return link as HTMLElement;
}

function getModerationMobileLink() {
  const nav = screen.getByRole("navigation", { name: "Admin workspace mobile" });
  const link = nav.querySelector('a[href="/admin/moderation"]');
  if (!link) {
    throw new Error("Moderation mobile link not found");
  }
  return link as HTMLElement;
}

describe("AdminSidebarNav moderation count", () => {
  it("hides the badge when no excursions await moderation", () => {
    render(<AdminSidebarNav counts={{ guides: 0, listings: 0 }} />);

    expect(within(getModerationSidebarLink()).queryByText("0")).not.toBeInTheDocument();
    expect(getModerationSidebarLink()).not.toHaveAttribute("aria-label");
  });

  it("shows the pending count on the moderation entry", () => {
    render(<AdminSidebarNav counts={{ guides: 0, listings: 3 }} />);

    expect(within(getModerationSidebarLink()).getByText("3")).toBeInTheDocument();
    expect(getModerationSidebarLink()).toHaveAttribute(
      "aria-label",
      "Модерация, 3 на проверке",
    );
  });

  it("clears the badge after the pending count drops to zero", () => {
    const { rerender } = render(<AdminSidebarNav counts={{ guides: 0, listings: 2 }} />);

    expect(within(getModerationSidebarLink()).getByText("2")).toBeInTheDocument();

    rerender(<AdminSidebarNav counts={{ guides: 0, listings: 0 }} />);

    expect(within(getModerationSidebarLink()).queryByText("2")).not.toBeInTheDocument();
    expect(getModerationSidebarLink()).not.toHaveAttribute("aria-label");
  });

  it("keeps the guides badge independent from moderation", () => {
    render(<AdminSidebarNav counts={{ guides: 4, listings: 0 }} />);

    const guidesLink = screen
      .getByRole("navigation", { name: "Admin workspace" })
      .querySelector('a[href="/admin/guides"]') as HTMLElement;
    expect(within(guidesLink).getByText("4")).toBeInTheDocument();
    expect(within(getModerationSidebarLink()).queryByText("4")).not.toBeInTheDocument();
  });
});

describe("AdminMobileTabs moderation count", () => {
  it("mirrors the moderation badge in the mobile nav", () => {
    const { rerender } = render(<AdminMobileTabs counts={{ guides: 0, listings: 0 }} />);

    expect(within(getModerationMobileLink()).queryByText("0")).not.toBeInTheDocument();

    rerender(<AdminMobileTabs counts={{ guides: 0, listings: 5 }} />);

    expect(within(getModerationMobileLink()).getByText("5")).toBeInTheDocument();
    expect(getModerationMobileLink()).toHaveAttribute(
      "aria-label",
      "Модерация, 5 на проверке",
    );
  });
});
