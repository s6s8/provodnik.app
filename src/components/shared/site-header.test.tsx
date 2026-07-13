import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/trips";
let mockUnreadCount = 0;
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
  const trigger = screen.getByRole("button", { name: /Меню аккаунта/i });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return trigger;
}

// The PRIMARY nav must honour hiddenNavHrefs, not just the account menu.
// Until /listings (item 7) every flag-gated href lived in the account menu, so
// filtering only `accountItems` was accidentally sufficient. A flag-gated primary
// entry rendered regardless of its flag and linked straight into a redirect.
//
// A unit test on filterNavItemsByHiddenHrefs() cannot catch this — the pure function
// was always correct; the COMPONENT simply never called it for the primary nav. This
// asserts the rendered DOM.
describe("SiteHeader primary nav flag gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
    mockUnreadCount = 0;
    useUnreadCountMock.mockImplementation(() => ({
      unreadCount: mockUnreadCount,
      refetch: vi.fn(),
    }));
  });

  it("shows the catalog entry when its flag is on", () => {
    render(<SiteHeader isAuthenticated={false} role={null} hiddenNavHrefs={[]} />);

    expect(screen.getByRole("link", { name: /Готовые экскурсии/ })).toBeInTheDocument();
  });

  it("hides the catalog entry when its flag is off", () => {
    render(
      <SiteHeader isAuthenticated={false} role={null} hiddenNavHrefs={["/listings"]} />,
    );

    expect(screen.queryByRole("link", { name: /Готовые экскурсии/ })).toBeNull();
    // The rest of the nav survives.
    expect(screen.getByRole("link", { name: /Запросы/ })).toBeInTheDocument();
  });

  it("hides it for an authenticated traveler too", () => {
    render(
      <SiteHeader
        isAuthenticated
        role="traveler"
        email="t@example.com"
        userId="user-1"
        hiddenNavHrefs={["/listings"]}
      />,
    );

    expect(screen.queryByRole("link", { name: /Готовые экскурсии/ })).toBeNull();
  });
});

describe("SiteHeader desktop account menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/trips";
    mockUnreadCount = 0;
    useUnreadCountMock.mockImplementation(() => ({
      unreadCount: mockUnreadCount,
      refetch: vi.fn(),
    }));
  });

  it("shows the avatar trigger for authenticated travelers", () => {
    renderAuthenticatedHeader("traveler");

    expect(
      screen.getByRole("button", { name: /Меню аккаунта/i }),
    ).toBeInTheDocument();
  });

  it("does not duplicate the create-request CTA on the homepage", () => {
    mockPathname = "/";
    renderAuthenticatedHeader("traveler");

    expect(screen.queryByRole("link", { name: "Создать запрос" })).toBeNull();
  });

  it("keeps the create-request CTA on non-home pages", () => {
    mockPathname = "/destinations";
    renderAuthenticatedHeader("traveler");

    expect(screen.getByRole("link", { name: "Создать запрос" })).toHaveAttribute("href", "/");
  });

  it.each(["/requests", "/destinations", "/how-it-works"])(
    "shows the account trigger on public route %s when authenticated",
    (pathname) => {
      mockPathname = pathname;
      renderAuthenticatedHeader("traveler");

      expect(
        screen.getByRole("button", { name: /Меню аккаунта/i }),
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

  it("shows first name in dropdown label when fullName is set", async () => {
    render(
      <SiteHeader
        isAuthenticated
        role="traveler"
        fullName="Анна Иванова"
        email="traveler@example.com"
        userId="user-1"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Меню аккаунта/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(await screen.findByText("Анна")).toBeInTheDocument();
    expect(screen.queryByText("Анна Иванова")).not.toBeInTheDocument();
  });

  it("falls back to the resolved role label in dropdown when fullName is absent", async () => {
    render(
      <SiteHeader
        isAuthenticated
        role="guide"
        email="guide@example.com"
        userId="user-2"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Меню аккаунта/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(await screen.findByText("Локальный гид")).toBeInTheDocument();
  });

  it("keeps a neutral account menu for authenticated users before role resolution", async () => {
    render(
      <SiteHeader
        isAuthenticated
        role={null}
        email="pending@example.com"
        userId="user-pending"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Меню аккаунта/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(await screen.findByText("Аккаунт")).toBeInTheDocument();
  });

  it("passes the authenticated state to unread message loading", () => {
    render(<SiteHeader isAuthenticated={false} />);

    expect(useUnreadCountMock).toHaveBeenCalledWith(false);
  });

  it("renders traveler menu items in the avatar dropdown", async () => {
    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByText("Профиль")).toBeInTheDocument();
    expect(screen.getByText("Помощь")).toBeInTheDocument();
    expect(screen.getByText("Выйти")).toBeInTheDocument();
  });

  it("submits desktop logout with POST when the item is selected", async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});

    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    const logoutItem = await screen.findByRole("menuitem", { name: "Выйти" });
    fireEvent.click(logoutItem);

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    const form = requestSubmit.mock.instances[0] as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/api/auth/signout");
    expect(form).toHaveAttribute("method", "post");

    requestSubmit.mockRestore();
  });

  it("shows «Настройки» for guides but not travellers in the desktop header dropdown", async () => {
    const { unmount } = renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByText("Профиль")).toBeInTheDocument();
    expect(screen.queryByText("Настройки")).not.toBeInTheDocument();

    unmount();
    renderAuthenticatedHeader("guide");

    await openAccountMenu();

    expect(await screen.findByText("Профиль гида")).toBeInTheDocument();
    expect(screen.getByText("Настройки")).toBeInTheDocument();
  });

  it("«Профиль» for traveler links to /account", async () => {
    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByRole("menuitem", { name: "Профиль" })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("«Профиль гида» for guide links to /guide/profile", async () => {
    renderAuthenticatedHeader("guide");

    await openAccountMenu();

    expect(
      await screen.findByRole("menuitem", { name: "Профиль гида" }),
    ).toHaveAttribute("href", "/guide/profile");
  });

  it("does not duplicate trips/notifications in the traveler avatar menu", async () => {
    renderAuthenticatedHeader("traveler");

    await openAccountMenu();

    expect(await screen.findByText("Профиль")).toBeInTheDocument();
    expect(screen.queryByText("Уведомления")).not.toBeInTheDocument();
    expect(screen.queryByText("Поездки")).not.toBeInTheDocument();
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
      screen.getByText("Навигация по разделам Проводника."),
    ).toBeInTheDocument();
  });
});
