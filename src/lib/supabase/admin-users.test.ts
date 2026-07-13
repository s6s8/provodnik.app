import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));

import { adminUsersFilterSchema } from "@/data/admin-users";
import { listAdminUsers } from "@/lib/supabase/admin-users";

type Result = { data: unknown; error: null; count?: number };

/** Chainable + thenable stand-in for a PostgREST query builder. */
function makeBuilder(result: Result) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "or", "not", "ilike", "contains", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.range = vi.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled: (value: Result) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder as Record<string, ReturnType<typeof vi.fn>> & { then: unknown };
}

function setup(options: { guideUserIds?: string[] } = {}) {
  // Profiles page stays empty: the assertions are about query construction.
  const guideQuery = makeBuilder({
    data: (options.guideUserIds ?? []).map((user_id) => ({ user_id })),
    error: null,
  });
  const profilesQuery = makeBuilder({ data: [], error: null, count: 0 });
  const adminClient = {
    from: vi.fn((table: string) => (table === "profiles" ? profilesQuery : guideQuery)),
  };
  requireAdminSession.mockResolvedValue({ adminClient });
  return { adminClient, guideQuery, profilesQuery };
}

describe("listAdminUsers geography filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restricts by array-contains when region is set", async () => {
    const { adminClient, guideQuery, profilesQuery } = setup({ guideUserIds: ["u1"] });

    await listAdminUsers(adminUsersFilterSchema.parse({ region: "Карелия" }));

    expect(adminClient.from).toHaveBeenCalledWith("guide_profiles");
    expect(guideQuery.contains).toHaveBeenCalledWith("regions", ["Карелия"]);
    expect(profilesQuery.in).toHaveBeenCalledWith("id", ["u1"]);
  });

  it("restricts by ilike substring when baseCity is set", async () => {
    const { guideQuery, profilesQuery } = setup({ guideUserIds: ["u1"] });

    await listAdminUsers(adminUsersFilterSchema.parse({ baseCity: "Тбилиси" }));

    expect(guideQuery.ilike).toHaveBeenCalledWith("base_city", "%Тбилиси%");
    expect(profilesQuery.in).toHaveBeenCalledWith("id", ["u1"]);
  });

  it("leaves the profiles query unrestricted when neither is set", async () => {
    const { adminClient, profilesQuery } = setup();

    await listAdminUsers(adminUsersFilterSchema.parse({}));

    expect(adminClient.from).not.toHaveBeenCalledWith("guide_profiles");
    expect(profilesQuery.in).not.toHaveBeenCalled();
  });

  it("returns the empty page shape when the geography filter matches nothing", async () => {
    const { adminClient } = setup({ guideUserIds: [] });

    const page = await listAdminUsers(
      adminUsersFilterSchema.parse({ region: "Нигде", baseCity: "Нигде" }),
    );

    expect(page).toEqual({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });
    expect(adminClient.from).not.toHaveBeenCalledWith("profiles");
  });
});
