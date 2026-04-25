import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useUnreadCount } from "./use-unread-count";

describe("useUnreadCount", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unreadCount 0 when fetch throws a network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );
    const { result } = renderHook(() => useUnreadCount(true));
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount 0 when fetch returns non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    const { result } = renderHook(() => useUnreadCount(true));
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount from successful fetch", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ unreadCount: 3, userId: "u-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const { result } = renderHook(() => useUnreadCount(true));
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3);
    });
  });
});
