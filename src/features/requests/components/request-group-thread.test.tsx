import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COPY } from "@/lib/copy";
import { RequestGroupThread } from "./request-group-thread";
import type { GroupMessage } from "@/lib/supabase/request-thread";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const messages: GroupMessage[] = [
  {
    id: "m1",
    body: "Всем привет, я организатор.",
    senderId: "owner-1",
    senderRole: "traveler",
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "m2",
    body: "Готов показать маршрут.",
    senderId: "guide-1",
    senderRole: "guide",
    createdAt: "2026-07-01T11:00:00.000Z",
  },
];

describe("RequestGroupThread", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders group messages, labels the current user, and posts a new message", async () => {
    const onSend = vi.fn().mockResolvedValue({ error: null });
    render(
      <RequestGroupThread messages={messages} currentUserId="owner-1" onSend={onSend} />,
    );

    // Both messages render; the current user's message is labelled «Вы», the guide «Гид».
    expect(screen.getByText("Всем привет, я организатор.")).toBeInTheDocument();
    expect(screen.getByText("Готов показать маршрут.")).toBeInTheDocument();
    expect(screen.getByText("Вы")).toBeInTheDocument();
    expect(screen.getByText(COPY.guide)).toBeInTheDocument();

    // Composer is disabled until there is text, then posts the trimmed body.
    const submit = screen.getByRole("button", { name: "Отправить" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Сообщение группе"), {
      target: { value: "  Когда встречаемся?  " },
    });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("Когда встречаемся?"));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it("surfaces a send error and does not refresh", async () => {
    const onSend = vi.fn().mockResolvedValue({ error: "Аккаунт ограничен." });
    render(
      <RequestGroupThread messages={[]} currentUserId="u1" onSend={onSend} />,
    );

    expect(
      screen.getByText(/Пока нет сообщений/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Сообщение группе"), {
      target: { value: "тест" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));

    await waitFor(() => expect(screen.getByText("Аккаунт ограничен.")).toBeInTheDocument());
    expect(refresh).not.toHaveBeenCalled();
  });
});
