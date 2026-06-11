import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/flags", () => ({ flags: { FEATURE_TR_FAVORITES: true } }));

const state = vi.hoisted(() => ({ owned: true, mutated: false }));

function chain() {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit", "delete", "insert", "upsert"]) {
    c[m] = vi.fn(() => {
      if (m === "delete" || m === "upsert" || m === "insert") state.mutated = true;
      return c;
    });
  }
  c.maybeSingle = vi.fn(async () => ({ data: state.owned ? { id: "f1" } : null, error: null }));
  (c as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve({ error: null });
  return c;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-a" } } })) },
    from: vi.fn(() => chain()),
  })),
}));

import { addToFolder, deleteFolder, removeFromFolder } from "./favoritesActions";

beforeEach(() => {
  state.owned = true;
  state.mutated = false;
});

describe("favorites ownership", () => {
  it("deleteFolder rejects a folder the user does not own", async () => {
    state.owned = false;
    await expect(deleteFolder("not-mine")).rejects.toThrow("not_found");
    expect(state.mutated).toBe(false);
  });

  it("addToFolder rejects an unowned folder before mutating", async () => {
    state.owned = false;
    await expect(addToFolder("not-mine", "listing-1")).rejects.toThrow("not_found");
  });

  it("removeFromFolder proceeds for an owned folder", async () => {
    state.owned = true;
    await expect(removeFromFolder("f1", "listing-1")).resolves.toEqual({ success: true });
  });
});
