import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRole } from "@/lib/auth/types";

const {
  createSupabaseMiddlewareClientMock,
  getDashboardPathForRoleMock,
  hasSupabaseEnvMock,
  parseDemoSessionCookieValueMock,
} = vi.hoisted(() => ({
  createSupabaseMiddlewareClientMock: vi.fn(),
  getDashboardPathForRoleMock: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
  parseDemoSessionCookieValueMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/demo-session", () => ({
  DEMO_SESSION_COOKIE: "provodnik_demo_session",
  parseDemoSessionCookieValue: parseDemoSessionCookieValueMock,
}));

vi.mock("@/lib/auth/role-routing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/role-routing")>();
  return {
    ...actual,
    getDashboardPathForRole: getDashboardPathForRoleMock,
  };
});

vi.mock("@/lib/supabase/middleware", () => ({
  createSupabaseMiddlewareClient: createSupabaseMiddlewareClientMock,
}));

import { proxy } from "./proxy";

function makeRequest(pathname: string) {
  return new NextRequest(`https://provodnik.app${pathname}`);
}

function mockSupabaseUser(role: AppRole | null) {
  const applyCookies = vi.fn((response) => response);
  createSupabaseMiddlewareClientMock.mockReturnValue({
    applyCookies,
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: role
              ? {
                  id: "user-1",
                  app_metadata: { role },
                  user_metadata: {},
                }
              : null,
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: role ? { role } : null,
        }),
      })),
    },
  });
  return applyCookies;
}

describe("proxy admin access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
    getDashboardPathForRoleMock.mockImplementation((role: AppRole | null | undefined) => {
      if (role === "traveler") return "/traveler/requests";
      if (role === "guide") return "/guide";
      if (role === "admin") return "/admin/dashboard";
      return null;
    });
  });

  it("lets authenticated non-admins reach /admin so the layout can show an access error", async () => {
    mockSupabaseUser("traveler");

    const response = await proxy(makeRequest("/admin/dashboard"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(getDashboardPathForRoleMock).not.toHaveBeenCalled();
  });

  it("still redirects non-admins away from guide-only routes", async () => {
    mockSupabaseUser("traveler");

    const response = await proxy(makeRequest("/guide/listings"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://provodnik.app/traveler/requests");
  });

  it("lets demo travelers reach /admin without Supabase env", async () => {
    hasSupabaseEnvMock.mockReturnValue(false);
    parseDemoSessionCookieValueMock.mockReturnValue({ role: "traveler" });

    const response = await proxy(makeRequest("/admin/dashboard"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(getDashboardPathForRoleMock).not.toHaveBeenCalled();
  });
});
