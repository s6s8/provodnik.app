import { act } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

const mockOn = vi.fn().mockReturnThis();
const mockSubscribe = vi.fn().mockReturnValue({});

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useUnreadCount } from "./use-unread-count";

describe("useUnreadCount", () => {
  beforeEach(() => {
    mockOn.mockClear();
    mockSubscribe.mockClear();
  });

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

  it("increments realtime count only for message or thread notifications", async () => {
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

    const changeHandler = (mockOn as Mock).mock.calls[0][2] as (payload: {
      new: { event_type?: string; kind?: string };
    }) => void;

    await act(async () => {
      changeHandler({ new: { event_type: "booking_created" } });
    });
    expect(result.current.unreadCount).toBe(3);

    await act(async () => {
      changeHandler({ new: { event_type: "thread_message_created" } });
    });
    expect(result.current.unreadCount).toBe(4);
  });
});
