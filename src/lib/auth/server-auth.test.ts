import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, createSupabaseServerClientMock, hasSupabaseEnvMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
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
  beforeEach(() => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
    hasSupabaseEnvMock.mockReturnValue(true);
    createSupabaseServerClientMock.mockReset();
  });

  it("hydrates demo traveler as authenticated when Supabase env is missing", async () => {
    hasSupabaseEnvMock.mockReturnValue(false);
    cookiesMock.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "provodnik_demo_session" ? { value: demoTravelerCookie } : undefined,
      ),
    });

    const auth = await readAuthContextFromServer();

    expect(auth.isAuthenticated).toBe(true);
    expect(auth.source).toBe("demo");
    expect(auth.role).toBe("traveler");
    expect(auth.userId).toBe("usr_traveler_you");
    expect(auth.canonicalRedirectTo).toBe("/traveler/requests");
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

  it("routes to admin dashboard when only JWT user_metadata carries admin", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      makeSupabaseClient(null, "guide", "admin"),
    );

    const auth = await readAuthContextFromServer();

    expect(auth.role).toBe("admin");
    expect(auth.canonicalRedirectTo).toBe("/admin/dashboard");
  });
});
