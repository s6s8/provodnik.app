import { render } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

const mockSubscribe = vi.fn().mockReturnValue({});
const mockOn = vi.fn().mockReturnThis();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

import { NotificationBell } from "./NotificationBell";

describe("NotificationBell", () => {
  it("passes an error callback to .subscribe()", () => {
    render(<NotificationBell userId="user-123" />);
    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it("subscribe callback does not throw when called with CHANNEL_ERROR", () => {
    render(<NotificationBell userId="user-123" />);
    const callback = (mockSubscribe as Mock).mock.calls[0][0] as (
      status: string,
      err?: Error
    ) => void;
    expect(() =>
      callback("CHANNEL_ERROR", new Error("WebSocket handshake failed"))
    ).not.toThrow();
  });
});
