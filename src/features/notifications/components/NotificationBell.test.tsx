import { render } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
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
                limit: mockLimit,
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

async function renderNotificationBell(userId = "user-123") {
  const view = render(<NotificationBell userId={userId} />);
  await act(async () => {
    await mockLimit.mock.results.at(-1)?.value;
  });
  return view;
}

describe("NotificationBell", () => {
  beforeEach(() => {
    mockLimit.mockClear();
    mockSubscribe.mockClear();
    mockOn.mockClear();
  });

  it("passes an error callback to .subscribe()", async () => {
    await renderNotificationBell();
    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it("subscribe callback does not log realtime CHANNEL_ERROR noise", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await renderNotificationBell();
    const callback = (mockSubscribe as Mock).mock.calls[0][0] as (
      status: string,
      err?: Error
    ) => void;
    expect(() => callback("CHANNEL_ERROR", new Error("WebSocket handshake failed"))).not.toThrow();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("handles realtime inserts inside act-friendly async flow", async () => {
    await renderNotificationBell();
    const changeHandler = (mockOn as Mock).mock.calls[0][2] as (payload: {
      new: {
        id: string;
        user_id: string;
        channel: string;
        status: string;
        title: string;
        body: string;
        created_at: string;
      };
    }) => void;

    await act(async () => {
      changeHandler({
        new: {
          id: "notification-1",
          user_id: "user-123",
          channel: "inbox",
          status: "new",
          title: "Новое сообщение",
          body: "Гид ответил на запрос.",
          created_at: "2026-05-31T06:00:00.000Z",
        },
      });
    });
  });
});
