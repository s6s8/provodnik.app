import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  createSupabaseServerClientMock,
  hasSupabaseEnvMock,
  readDemoTravelerProfileFromCookiesMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
  readDemoTravelerProfileFromCookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/demo-traveler-profile", () => ({
  readDemoTravelerProfileFromCookies: readDemoTravelerProfileFromCookiesMock,
}));

import { readAuthContextFromServer } from "./server-auth";

function makeSupabaseClient(
  profileRole: string | null,
  appMetadataRole: string | null,
  userMetadataRole?: string | null,
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "guide@example.test",
            app_metadata: appMetadataRole ? { role: appMetadataRole } : {},
            user_metadata: userMetadataRole ? { role: userMetadataRole } : {},
          },
        },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "user-1",
              role: profileRole,
              full_name: "Guide User",
              avatar_url: null,
            },
          }),
        })),
      })),
    })),
  };
}

const demoTravelerCookie = encodeURIComponent(
  JSON.stringify({ mode: "demo", role: "traveler", createdAt: "2026-06-02T00:00:00.000Z" }),
);

describe("readAuthContextFromServer", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
    hasSupabaseEnvMock.mockReturnValue(true);
    createSupabaseServerClientMock.mockReset();
    readDemoTravelerProfileFromCookiesMock.mockResolvedValue(null);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("hydrates demo traveler as authenticated when Supabase env is missing", async () => {
    hasSupabaseEnvMock.mockReturnValue(false);
    readDemoTravelerProfileFromCookiesMock.mockResolvedValue({
      full_name: "Анна Демо",
      bio: null,
      home_city: null,
      languages: null,
      birth_year: null,
    });
    cookiesMock.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "provodnik_demo_session" ? { value: demoTravelerCookie } : undefined,
      ),
    });

    const auth = await readAuthContextFromServer();

    expect(auth.isAuthenticated).toBe(true);
    expect(auth.source).toBe("demo");
    expect(auth.role).toBe("traveler");
    expect(auth.fullName).toBe("Анна Демо");
    expect(auth.userId).toBe("usr_traveler_you");
    expect(auth.canonicalRedirectTo).toBe("/trips");
  });

  it("ignores demo cookies when Supabase env is configured and session is absent", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "provodnik_demo_session" ? { value: demoTravelerCookie } : undefined,
      ),
    });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const auth = await readAuthContextFromServer();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.role).toBeNull();
    expect(auth.canonicalRedirectTo).toBeNull();
  });

  it("falls back to user_metadata.full_name when the profile row has no stored name", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "traveler@example.test",
              app_metadata: { role: "traveler" },
              user_metadata: { role: "traveler", full_name: "Мария Иванова" },
            },
          },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "user-1",
                role: "traveler",
                full_name: null,
                avatar_url: null,
              },
            }),
          })),
        })),
      })),
    });

    const auth = await readAuthContextFromServer();

    expect(auth.fullName).toBe("Мария Иванова");
    expect(auth.role).toBe("traveler");
  });

  it("uses profiles.role over stale JWT metadata for dashboard routing", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient("guide", "traveler"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("guide");
    expect(auth.canonicalRedirectTo).toBe("/guide");
    expect(auth.missingRoleRecoveryTo).toBeNull();
  });

  it("falls back to app_metadata role when profile role is missing", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient(null, "guide"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("guide");
    expect(auth.canonicalRedirectTo).toBe("/guide");
    expect(auth.missingRoleRecoveryTo).toBeNull();
  });

  it("routes to admin dashboard when profile.role is admin", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient("admin", "guide"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("admin");
    expect(auth.canonicalRedirectTo).toBe("/admin/dashboard");
  });

  it("routes to admin dashboard when profiles.role is admin and JWT is stale guide", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient("admin", "guide", "guide"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("admin");
    expect(auth.canonicalRedirectTo).toBe("/admin/dashboard");
  });

  it("does not grant a role when only JWT user_metadata carries admin", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient(null, "guide", "admin"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("guide");
    expect(auth.canonicalRedirectTo).toBe("/guide");
  });

  // Row #37: a getUser() failure during layout SSR must degrade to an
  // unauthenticated context, never throw — an uncaught throw in a layout 500s
  // the whole tree (the blank "critical error" seen after signup).
  it("degrades to unauthenticated when getUser returns an auth error", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "invalid claim: missing sub claim" },
        }),
      },
    });

    const auth = await readAuthContextFromServer();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.role).toBeNull();
  });

  it("degrades to unauthenticated when getUser throws instead of 500ing SSR", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error("network reset mid-refresh")),
      },
    });

    await expect(readAuthContextFromServer()).resolves.toMatchObject({
      isAuthenticated: false,
    });
  });

  it("fails closed and logs telemetry when the profile role read errors", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "admin@example.test",
              app_metadata: { role: "admin" },
              user_metadata: { role: "admin", full_name: "Admin User" },
            },
          },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "permission denied for table profiles" },
            }),
          })),
        })),
      })),
    });

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBeNull();
    expect(auth.canonicalRedirectTo).toBeNull();
    expect(auth.missingRoleRecoveryTo).toBe("/auth?error=missing-role");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[server-auth] profile role read failed",
      {
        userId: "user-1",
        error: "permission denied for table profiles",
      },
    );
  });
});
