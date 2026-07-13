import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/lib/auth/types";

const {
  getAdminNavCountsMock,
  hasSupabaseAdminEnvMock,
  readAuthContextFromServerMock,
  redirectMock,
} = vi.hoisted(() => ({
  getAdminNavCountsMock: vi.fn(),
  hasSupabaseAdminEnvMock: vi.fn(),
  readAuthContextFromServerMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  usePathname: () => "/admin/dashboard",
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseAdminEnv: hasSupabaseAdminEnvMock,
}));

vi.mock("@/lib/supabase/moderation", () => ({
  getAdminNavCounts: getAdminNavCountsMock,
}));

import AdminLayout from "./layout";

function makeAuthContext(overrides: Partial<AuthContext>): AuthContext {
  return {
    hasSupabaseEnv: true,
    isAuthenticated: true,
    source: "supabase",
    role: "admin",
    accountStatus: "active",
    email: "admin@example.com",
    fullName: null,
    avatarUrl: null,
    userId: "user-1",
    canonicalRedirectTo: "/admin/dashboard",
    missingRoleRecoveryTo: null,
    ...overrides,
  };
}

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseAdminEnvMock.mockReturnValue(true);
  });

  it("shows a clear on-screen error when the user is not an admin", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({
        role: "traveler",
        email: "traveler@example.com",
        canonicalRedirectTo: "/trips",
      }),
    );

    const ui = await AdminLayout({
      children: <div>Секретная админка</div>,
    });
    render(ui);

    expect(screen.getByText("Админка недоступна")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Нужны права администратора" })).toBeInTheDocument();
    expect(
      screen.getByText(/Этот раздел доступен только администраторам «Проводника»/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вернуться в свой кабинет" })).toHaveAttribute(
      "href",
      "/trips",
    );
    expect(screen.queryByText("Секретная админка")).not.toBeInTheDocument();
    expect(getAdminNavCountsMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders admin workspace when the session resolves to admin", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(makeAuthContext({ role: "admin" }));
    getAdminNavCountsMock.mockResolvedValueOnce({ guides: 2, listings: 1 });

    const ui = await AdminLayout({
      children: <div data-testid="admin-child">Очередь проверки</div>,
    });
    render(ui);

    expect(screen.getByText("Панель администратора")).toBeInTheDocument();
    expect(screen.getByTestId("admin-child")).toBeInTheDocument();
    expect(screen.queryByText("Админка недоступна")).not.toBeInTheDocument();
    expect(getAdminNavCountsMock).toHaveBeenCalledOnce();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders admin shell without service-role env (nav counts stay zero)", async () => {
    hasSupabaseAdminEnvMock.mockReturnValueOnce(false);
    readAuthContextFromServerMock.mockResolvedValueOnce(makeAuthContext({ role: "admin" }));

    const ui = await AdminLayout({
      children: <div data-testid="admin-child">Очередь проверки</div>,
    });
    render(ui);

    expect(screen.getByText("Панель администратора")).toBeInTheDocument();
    expect(screen.getByTestId("admin-child")).toBeInTheDocument();
    expect(getAdminNavCountsMock).not.toHaveBeenCalled();
  });
});
