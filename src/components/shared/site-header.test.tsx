import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/traveler/requests";
let mockUnreadCount = 0;

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/features/messaging/hooks/use-unread-count", () => ({
  useUnreadCount: () => ({
    unreadCount: mockUnreadCount,
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
    mockPathname = "/traveler/requests";
    mockUnreadCount = 0;
  });

  it("shows the avatar trigger for authenticated travelers", () => {
    renderAuthenticatedHeader("traveler");

    expect(
      screen.getByRole("button", { name: "Меню аккаунта" }),
    ).toBeInTheDocument();
  });

  it.each(["/requests", "/destinations", "/how-it-works"])(
    "shows the account trigger on public route %s when authenticated",
    (pathname) => {
      mockPathname = pathname;
      renderAuthenticatedHeader("traveler");

      expect(
        screen.getByRole("button", { name: "Меню аккаунта" }),
      ).toBeInTheDocument();
    },
  );

  it("hides the account trigger for guests on public routes", () => {
    mockPathname = "/destinations";
    render(<SiteHeader />);

    expect(
      screen.queryByRole("button", { name: "Меню аккаунта" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Войти/i })).toBeInTheDocument();
  });

  it("shows the profile full name next to the avatar when fullName is set", () => {
    render(
      <SiteHeader
        isAuthenticated
        role="traveler"
        fullName="Анна Иванова"
        email="traveler@example.com"
        userId="user-1"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Меню аккаунта" });
    expect(trigger).toHaveTextContent("Анна Иванова");
    expect(trigger).not.toHaveTextContent("Путешественник");
  });

  it("falls back to the role label when fullName is absent", () => {
    render(
      <SiteHeader
        isAuthenticated
        role="guide"
        email="guide@example.com"
        userId="user-2"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Меню аккаунта" });
    expect(trigger).toHaveTextContent("Гид");
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

  it("includes unread message count in the messages link label", () => {
    mockUnreadCount = 7;

    renderAuthenticatedHeader("traveler");

    expect(
      screen.getByRole("link", { name: "Сообщения, непрочитанных: 7" }),
    ).toHaveAttribute("href", "/messages");
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
