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

describe("guide template creation status", () => {
  it("creates every new ready tour in pending_review", async () => {
    await createGuideTemplate({ title: "Тур", priceFromRub: 4500 });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_review" }),
    );
  });

  it("never inserts draft on create", async () => {
    insert.mockClear();
    await createGuideTemplate({ title: "Черновик", priceFromRub: 3000 });
    await createGuideTemplate({ title: "Тур 2", priceFromRub: 4500 });

    for (const [payload] of insert.mock.calls) {
      expect(payload).toMatchObject({ status: "pending_review" });
      expect(payload.status).not.toBe("draft");
    }
  });
});

describe("guide template price scope", () => {
  it("creates a ready tour with per-group pricing by default", async () => {
    await createGuideTemplate({ title: "Тур", priceFromRub: 4500 });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ price_scope: "per_group", price_from_kopecks: 450000 }),
    );
  });

  it("persists an explicit per-person price scope on create", async () => {
    insert.mockClear();
    await createGuideTemplate({
      title: "Тур",
      priceFromRub: 1200,
      priceScope: "per_person",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ price_scope: "per_person", price_from_kopecks: 120000 }),
    );
  });

  it("updates price scope when the guide changes it", async () => {
    await updateGuideTemplate("tpl-1", {
      title: "Тур 2",
      priceFromRub: 5000,
      priceScope: "per_person",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ price_scope: "per_person" }),
    );
  });

  it("does not touch price scope when it is omitted on update", async () => {
    update.mockClear();
    await updateGuideTemplate("tpl-1", { title: "Тур 2", priceFromRub: 5000 });

    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ price_scope: expect.anything() }),
    );
  });
});
