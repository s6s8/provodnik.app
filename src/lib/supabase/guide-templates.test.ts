import { describe, expect, it, vi } from "vitest";

import { createGuideTemplate, updateGuideTemplate } from "./guide-templates";

const insert = vi.fn();
const update = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-1" } }, error: null }),
    },
    from: vi.fn(() => ({
      insert: (payload: Record<string, unknown>) => {
        insert(payload);
        return { select: () => ({ single: async () => ({ data: payload, error: null }) }) };
      },
      update: (payload: Record<string, unknown>) => {
        update(payload);
        return {
          eq: () => ({ select: () => ({ single: async () => ({ data: payload, error: null }) }) }),
        };
      },
    })),
  })),
}));

describe("guide template price scope", () => {
  it("creates every ready tour with per-group pricing", async () => {
    await createGuideTemplate({ title: "Тур", priceFromRub: 4500 });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ price_scope: "per_group", price_from_kopecks: 450000 }),
    );
  });

  it("never rewrites the price scope of an existing tour", async () => {
    await updateGuideTemplate("tpl-1", { title: "Тур 2", priceFromRub: 5000 });

    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ price_scope: expect.anything() }),
    );
  });
});
