import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import {
  bulkSetStatus,
  quickEditTitle,
} from "./listingManagementActions";

function makeSupabase(updateResult: { error: Error | null; count: number | null }) {
  const query = {
    update: vi.fn(() => query),
    in: vi.fn(() => query),
    eq: vi.fn(() => query),
    then: vi.fn(),
  };
  query.then.mockImplementation((resolve, reject) =>
    Promise.resolve(updateResult).then(resolve, reject),
  );

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "guide-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => query),
  };

  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return { supabase, query };
}

describe("listing management actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests an exact affected-row count for bulk status updates", async () => {
    const { query } = makeSupabase({ error: null, count: 2 });

    await bulkSetStatus(["listing-1", "listing-2"], "archived");

    expect(query.update).toHaveBeenCalledWith(
      { status: "archived" },
      { count: "exact" },
    );
  });

  it("throws when quick title edit updates no owned listing", async () => {
    makeSupabase({ error: null, count: 0 });

    await expect(quickEditTitle("listing-1", "New title")).rejects.toThrow(
      "Экскурсия не найдена или не принадлежит вам.",
    );
  });
});
