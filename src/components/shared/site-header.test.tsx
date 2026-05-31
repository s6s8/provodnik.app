import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/traveler/requests",
}));

vi.mock("@/features/messaging/hooks/use-unread-count", () => ({
  useUnreadCount: () => ({
    unreadCount: 0,
    refetch: vi.fn(),
  }),
}));

import { SiteHeader } from "./site-header";

function renderAuthenticatedHeader(role: "traveler" | "guide") {
  return render(
    <SiteHeader
      isAuthenticated
      role={role}
      email={`${role}@example.com`}
      userId="user-1"
    />,
  );
}

async function openAccountMenu() {
  const trigger = screen.getByRole("button", { name: "Меню аккаунта" });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return trigger;
}

describe("SiteHeader desktop account menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the avatar trigger for authenticated travelers", () => {
    renderAuthenticatedHeader("traveler");

    expect(
      screen.getByRole("button", { name: "Меню аккаунта" }),
    ).toBeInTheDocument();
  });

  it("renders traveler menu items in the avatar dropdown", async () => {
    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByText("Мой профиль")).toBeInTheDocument();
    expect(screen.getByText("Помощь")).toBeInTheDocument();
    expect(screen.getByText("Выйти")).toBeInTheDocument();
  });

  it("hides «Настройки» in the desktop header dropdown for both travellers and guides (settings merged into profile)", async () => {
    const { unmount } = renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByText("Мой профиль")).toBeInTheDocument();
    expect(screen.queryByText("Настройки")).not.toBeInTheDocument();

    unmount();
    renderAuthenticatedHeader("guide");

    await openAccountMenu();

    expect(await screen.findByText("Мой профиль")).toBeInTheDocument();
    expect(screen.queryByText("Настройки")).not.toBeInTheDocument();
  });

  it("«Мой профиль» for traveler links to /profile/personal", async () => {
    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByRole("menuitem", { name: "Мой профиль" })).toHaveAttribute(
      "href",
      "/profile/personal",
    );
  });

  it("«Мой профиль» for guide links to /guide/profile", async () => {
    renderAuthenticatedHeader("guide");

    await openAccountMenu();

    expect(await screen.findByRole("menuitem", { name: "Мой профиль" })).toHaveAttribute(
      "href",
      "/guide/profile",
    );
  });
});

describe("SiteHeader mobile menu", () => {
  it("renders an accessible sheet description", () => {
    render(<SiteHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    expect(
      screen.getByText("Навигация по разделам Provodnik."),
    ).toBeInTheDocument();
  });
});
