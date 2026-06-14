import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  hasSupabaseEnvMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { viewerRoleForRequest } from "./viewer-role-for-request";

type TableName = "traveler_requests" | "profiles" | "guide_profiles";

function makeQueryResult(data: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return query;
}

function makeSupabaseClient({
  userId,
  travelerId,
  profileRole,
  appMetadataRole,
  guideVerificationStatus,
}: {
  userId: string | null;
  travelerId: string | null;
  profileRole: string | null;
  appMetadataRole: string | null;
  guideVerificationStatus: string | null;
}) {
  const queries: Record<TableName, ReturnType<typeof makeQueryResult>> = {
    traveler_requests: makeQueryResult(
      travelerId ? { traveler_id: travelerId } : null,
    ),
    profiles: makeQueryResult(
      profileRole ? { role: profileRole } : null,
    ),
    guide_profiles: makeQueryResult(
      guideVerificationStatus
        ? { verification_status: guideVerificationStatus }
        : null,
    ),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId
            ? {
                id: userId,
                app_metadata: appMetadataRole ? { role: appMetadataRole } : {},
              }
            : null,
        },
        error: null,
      }),
    },
    from: vi.fn((table: TableName) => queries[table]),
    queries,
  };
}

describe("viewerRoleForRequest", () => {
  beforeEach(() => {
    hasSupabaseEnvMock.mockReturnValue(true);
    createSupabaseServerClientMock.mockReset();
  });

  it("returns owner when the current user owns the request", async () => {
    const supabase = makeSupabaseClient({
      userId: "user-owner",
      travelerId: "user-owner",
      profileRole: "traveler",
      appMetadataRole: "traveler",
      guideVerificationStatus: null,
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);

    await expect(viewerRoleForRequest("request-1")).resolves.toBe("owner");
  });

  it("returns guide for an approved guide who can bid", async () => {
    const supabase = makeSupabaseClient({
      userId: "user-guide",
      travelerId: "user-owner",
      profileRole: "guide",
      appMetadataRole: "guide",
      guideVerificationStatus: "approved",
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);

    await expect(viewerRoleForRequest("request-1")).resolves.toBe("guide");
  });

  it("returns admin when the existing admin role check matches", async () => {
    const supabase = makeSupabaseClient({
      userId: "user-admin",
      travelerId: "user-owner",
      profileRole: "admin",
      appMetadataRole: "guide",
      guideVerificationStatus: null,
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);

    await expect(viewerRoleForRequest("request-1")).resolves.toBe("admin");
  });

  it("returns public when no user is authenticated", async () => {
    const supabase = makeSupabaseClient({
      userId: null,
      travelerId: "user-owner",
      profileRole: null,
      appMetadataRole: null,
      guideVerificationStatus: null,
    });
    createSupabaseServerClientMock.mockResolvedValue(supabase);

    await expect(viewerRoleForRequest("request-1")).resolves.toBe("public");
  });
});
