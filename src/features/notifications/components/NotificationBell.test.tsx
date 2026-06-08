import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const mockLimit = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({});
const mockOn = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockSelectSingle = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockEqUserIdSingle = vi.fn(() => ({ select: mockSelectSingle }));
const mockSelectBulk = vi.fn();
const mockOr = vi.fn(() => ({ select: mockSelectBulk }));
const mockUpdateEq = vi.fn((column: string) => {
  if (column === "id") return { eq: mockEqUserIdSingle };
  if (column === "user_id") return { or: mockOr };
  return { eq: vi.fn() };
});
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    }),
  }),
  update: mockUpdate,
});

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe }),
    from: mockFrom,
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

import { NotificationBell } from "./NotificationBell";

const unreadNotification = {
  id: "notification-1",
  user_id: "user-123",
  event_type: "new_offer",
  payload: null,
  channel: "inbox",
  status: "sent",
  created_at: "2026-05-31T06:00:00.000Z",
  read_at: null,
};

async function renderNotificationBell(userId = "user-123") {
  const view = render(<NotificationBell userId={userId} />);
  await act(async () => {
    await mockLimit.mock.results.at(-1)?.value;
  });
  return view;
}

async function openBellWithUnreadNotification() {
  mockLimit.mockResolvedValueOnce({
    data: [unreadNotification],
    error: null,
  });

  await renderNotificationBell();
  fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));
  expect(await screen.findByText("Новое предложение от гида")).toBeInTheDocument();
}

describe("NotificationBell", () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockSubscribe.mockClear();
    mockOn.mockClear();
    mockUpdate.mockClear();
    mockUpdateEq.mockClear();
    mockEqUserIdSingle.mockClear();
    mockSelectSingle.mockClear();
    mockMaybeSingle.mockReset();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockOr.mockClear();
    mockSelectBulk.mockReset();
    mockSelectBulk.mockResolvedValue({ data: [], error: null });
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

  it("keeps a notification visible when marking it read fails", async () => {
    mockLimit.mockResolvedValueOnce({
      data: [unreadNotification],
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error("denied") });

    await renderNotificationBell();
    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));
    expect(await screen.findByText("Новое предложение от гида")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Новое предложение от гида"));

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "notification-1");
      expect(mockEqUserIdSingle).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockSelectSingle).toHaveBeenCalledWith("id");
      expect(mockMaybeSingle).toHaveBeenCalled();
    });
    expect(screen.getByText("Новое предложение от гида")).toBeInTheDocument();
  });

  it("does not remove a notification when mark-read updates zero rows without error", async () => {
    await openBellWithUnreadNotification();
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    fireEvent.click(screen.getByText("Новое предложение от гида"));

    await waitFor(() => {
      expect(mockMaybeSingle).toHaveBeenCalled();
    });
    expect(screen.getByText("Новое предложение от гида")).toBeInTheDocument();
    expect(screen.queryByText("Нет новых уведомлений")).not.toBeInTheDocument();
  });

  it("removes a notification only after mark-read returns a selected row", async () => {
    await openBellWithUnreadNotification();
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: "notification-1" }, error: null });

    fireEvent.click(screen.getByText("Новое предложение от гида"));

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "notification-1");
      expect(mockEqUserIdSingle).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockSelectSingle).toHaveBeenCalledWith("id");
      expect(mockMaybeSingle).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText("Новое предложение от гида")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Нет новых уведомлений")).toBeInTheDocument();
  });

  it("keeps notifications visible when mark-all updates zero rows without error", async () => {
    await openBellWithUnreadNotification();
    mockSelectBulk.mockResolvedValueOnce({ data: [], error: null });

    fireEvent.click(screen.getByRole("button", { name: "Отметить все как прочитанные" }));

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockOr).toHaveBeenCalledWith("status.neq.read,read_at.is.null");
      expect(mockSelectBulk).toHaveBeenCalledWith("id");
    });
    expect(screen.getByText("Новое предложение от гида")).toBeInTheDocument();
    expect(screen.queryByText("Нет новых уведомлений")).not.toBeInTheDocument();
  });

  it("clears notifications only after mark-all returns selected rows", async () => {
    await openBellWithUnreadNotification();
    mockSelectBulk.mockResolvedValueOnce({ data: [{ id: "notification-1" }], error: null });

    fireEvent.click(screen.getByRole("button", { name: "Отметить все как прочитанные" }));

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockOr).toHaveBeenCalledWith("status.neq.read,read_at.is.null");
      expect(mockSelectBulk).toHaveBeenCalledWith("id");
    });
    await waitFor(() => {
      expect(screen.queryByText("Новое предложение от гида")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Нет новых уведомлений")).toBeInTheDocument();
  });
});
