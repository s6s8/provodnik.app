import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/lib/auth/types";

const { readAuthContextFromServerMock, redirectMock } = vi.hoisted(() => ({
  readAuthContextFromServerMock: vi.fn(),
  redirectMock: vi.fn((pathname: string) => {
    throw new Error(`NEXT_REDIRECT:${pathname}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/components/shared/guide-bottom-nav", () => ({
  GuideBottomNav: () => <nav>Guide bottom nav</nav>,
}));

import GuideLayout from "./guide/layout";
import TripsLayout from "./trips/layout";

function makeAuthContext(overrides: Partial<AuthContext>): AuthContext {
  return {
    hasSupabaseEnv: true,
    isAuthenticated: true,
    source: "supabase",
    role: "guide",
    accountStatus: "active",
    email: "guide@example.com",
    fullName: null,
    avatarUrl: null,
    userId: "user-1",
    canonicalRedirectTo: "/guide",
    missingRoleRecoveryTo: null,
    ...overrides,
  };
}

describe("protected role layouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation((pathname: string) => {
      throw new Error(`NEXT_REDIRECT:${pathname}`);
    });
  });

  it("redirects unresolved guide sessions without rendering children", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({
        role: null,
        missingRoleRecoveryTo: "/auth?error=missing-role",
      }),
    );

    await expect(
      GuideLayout({
        children: <div>Guide workspace</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth?error=missing-role");

    expect(redirectMock).toHaveBeenCalledWith("/auth?error=missing-role");
    expect(screen.queryByText("Guide workspace")).not.toBeInTheDocument();
  });

  it("redirects unresolved trips sessions without rendering children", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({
        role: null,
        missingRoleRecoveryTo: "/auth?error=missing-role",
      }),
    );

    await expect(
      TripsLayout({
        children: <div>Trips workspace</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth?error=missing-role");

    expect(redirectMock).toHaveBeenCalledWith("/auth?error=missing-role");
    expect(screen.queryByText("Trips workspace")).not.toBeInTheDocument();
  });

  it("redirects suspended guide sessions without rendering children", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({ accountStatus: "suspended" }),
    );

    await expect(
      GuideLayout({
        children: <div>Guide workspace</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth?error=account-suspended");

    expect(redirectMock).toHaveBeenCalledWith("/auth?error=account-suspended");
    expect(screen.queryByText("Guide workspace")).not.toBeInTheDocument();
  });

  it("redirects archived traveler sessions without rendering children", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({
        role: "traveler",
        accountStatus: "archived",
        canonicalRedirectTo: "/trips",
      }),
    );

    await expect(
      TripsLayout({
        children: <div>Trips workspace</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth?error=account-suspended");

    expect(redirectMock).toHaveBeenCalledWith("/auth?error=account-suspended");
    expect(screen.queryByText("Trips workspace")).not.toBeInTheDocument();
  });

  it("renders the guide layout for guide sessions", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(makeAuthContext({ role: "guide" }));

    const ui = await GuideLayout({
      children: <div>Guide workspace</div>,
    });
    render(ui);

    expect(screen.getByText("Guide workspace")).toBeInTheDocument();
    expect(screen.getByText("Guide bottom nav")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders the trips layout for traveler sessions", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce(
      makeAuthContext({
        role: "traveler",
        canonicalRedirectTo: "/trips",
      }),
    );

    const ui = await TripsLayout({
      children: <div>Trips workspace</div>,
    });
    render(ui);

    expect(screen.getByText("Trips workspace")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
