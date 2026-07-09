import { act, createElement, type PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { messagesApi } from "@/lib/api/messages";
import { useUnreadCount } from "./use-unread-count";

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

const { mockOn, mockSubscribe } = vi.hoisted(() => ({
  mockOn: vi.fn().mockReturnThis(),
  mockSubscribe: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

function renderUnreadCountHook() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return renderHook(() => useUnreadCount(true), { wrapper });
}

describe("useUnreadCount", () => {
  beforeEach(() => {
    mockOn.mockClear();
    mockSubscribe.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unreadCount 0 when fetch throws a network error", async () => {
    vi.spyOn(messagesApi, "unreadCount").mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderUnreadCountHook();
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount 0 when fetch returns non-ok response", async () => {
    vi.spyOn(messagesApi, "unreadCount").mockRejectedValueOnce(new Error("request_failed:500"));
    const { result } = renderUnreadCountHook();
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount from successful fetch", async () => {
    vi.spyOn(messagesApi, "unreadCount").mockResolvedValueOnce({ unreadCount: 3, userId: "u-1" });
    const { result } = renderUnreadCountHook();
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3);
    });
  });

  it("increments realtime count only for message or thread notifications", async () => {
    vi.spyOn(messagesApi, "unreadCount").mockResolvedValueOnce({ unreadCount: 3, userId: "u-1" });

    const { result } = renderUnreadCountHook();
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
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(4);
    });
  });
});
