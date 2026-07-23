import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    rpc,
  }),
}));

import { updateGuideLocationPhotoOrders } from "@/lib/supabase/guide-assets";

describe("updateGuideLocationPhotoOrders", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: null, error: null });
  });

  it("writes the full reorder payload in one RPC call", async () => {
    await updateGuideLocationPhotoOrders([
      { id: "photo-1", sort_order: 2 },
      { id: "photo-2", sort_order: 1 },
      { id: "photo-3", sort_order: 0 },
    ]);

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("reorder_guide_location_photos", {
      p_photo_orders: [
        { id: "photo-1", sort_order: 2 },
        { id: "photo-2", sort_order: 1 },
        { id: "photo-3", sort_order: 0 },
      ],
    });
  });
});
