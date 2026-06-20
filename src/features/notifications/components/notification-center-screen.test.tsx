import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseBrowserClient } = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient,
}));

import { NotificationCenterScreen } from "./notification-center-screen";

const userId = "22222222-2222-4222-8222-222222222222";
const notificationId = "33333333-3333-4333-8333-333333333333";

function createNotificationClient() {
  const loadOrder = vi.fn().mockResolvedValue({
    data: [
      {
        id: notificationId,
        user_id: userId,
        kind: "new_offer",
        title: "Новое предложение",
        body: "Гид отправил предложение.",
        href: null,
        is_read: true,
        status: "sent",
        read_at: null,
        created_at: "2026-06-03T06:00:00.000Z",
      },
    ],
    error: null,
  });
  const loadEq = vi.fn(() => ({ order: loadOrder }));
  const select = vi.fn(() => ({ eq: loadEq }));

  const updateMaybeSingle = vi.fn().mockResolvedValue({
    data: { id: notificationId },
    error: null,
  });
  const updateSelect = vi.fn(() => ({ maybeSingle: updateMaybeSingle }));
  const updateUserEq = vi.fn(() => ({ select: updateSelect }));
  const updateIdEq = vi.fn(() => ({ eq: updateUserEq }));
  const update = vi.fn(() => ({ eq: updateIdEq }));

  const from = vi.fn(() => ({ select, update }));

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from,
    },
    loadEq,
    update,
    updateIdEq,
    updateUserEq,
    updateSelect,
    updateMaybeSingle,
  };
}

describe("NotificationCenterScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes notification reads and mark-read updates to the authenticated user", async () => {
    const supabase = createNotificationClient();
    createSupabaseBrowserClient.mockReturnValue(supabase.client);

    render(<NotificationCenterScreen />);

    expect(await screen.findByText("Новое предложение")).toBeInTheDocument();
    expect(supabase.loadEq).toHaveBeenCalledWith("user_id", userId);
    expect(screen.getAllByText("1")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Отметить прочитанным" }));

    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({
        is_read: true,
        status: "read",
        read_at: expect.any(String),
      });
      expect(supabase.updateIdEq).toHaveBeenCalledWith("id", notificationId);
      expect(supabase.updateUserEq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  it("keeps an unread notification unchanged when mark-read updates zero rows", async () => {
    const supabase = createNotificationClient();
    supabase.updateMaybeSingle.mockResolvedValue({ data: null, error: null });
    createSupabaseBrowserClient.mockReturnValue(supabase.client);

    render(<NotificationCenterScreen />);

    expect(await screen.findByText("Новое предложение")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Отметить прочитанным" }));

    await waitFor(() => {
      expect(supabase.updateMaybeSingle).toHaveBeenCalled();
    });
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("Новое")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отметить прочитанным" }),
    ).toBeInTheDocument();
  });

  it("shows a load failure instead of the empty inbox when notifications fail to load", async () => {
    const supabase = createNotificationClient();
    supabase.loadEq.mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("RLS load failed"),
      }),
    });
    createSupabaseBrowserClient.mockReturnValue(supabase.client);

    render(<NotificationCenterScreen />);

    expect(
      await screen.findByText("Не удалось загрузить"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Пока пусто")).not.toBeInTheDocument();
  });
});
