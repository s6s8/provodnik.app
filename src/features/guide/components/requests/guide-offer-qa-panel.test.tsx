import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getQaPanelDataAction, sendQaReplyAction } = vi.hoisted(() => ({
  getQaPanelDataAction: vi.fn(),
  sendQaReplyAction: vi.fn(),
}));

vi.mock("../../actions/send-qa-reply", () => ({
  getQaPanelDataAction,
  sendQaReplyAction,
}));

import { GuideOfferQaPanel } from "./guide-offer-qa-panel";

describe("GuideOfferQaPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces load failures instead of staying stuck in loading state", async () => {
    getQaPanelDataAction.mockRejectedValue(new Error("network failed"));

    render(<GuideOfferQaPanel offerId="offer-1" />);

    expect(await screen.findByText("Не удалось загрузить вопросы")).toBeInTheDocument();
    expect(screen.queryByText("Загрузка вопросов...")).not.toBeInTheDocument();
  });

  it("refetches panel data after a successful reply", async () => {
    getQaPanelDataAction
      .mockResolvedValueOnce({
        threadId: "thread-1",
        qa: {
          thread_id: "thread-1",
          messages: [
            {
              id: "msg-1",
              sender_role: "traveler",
              body: "Можно начать позже?",
            },
          ],
          message_count: 1,
          at_limit: false,
        },
      })
      .mockResolvedValueOnce({
        threadId: "thread-1",
        qa: {
          thread_id: "thread-1",
          messages: [
            {
              id: "msg-1",
              sender_role: "traveler",
              body: "Можно начать позже?",
            },
            {
              id: "msg-2",
              sender_role: "guide",
              body: "Да, можем.",
            },
          ],
          message_count: 2,
          at_limit: false,
        },
      });
    sendQaReplyAction.mockResolvedValue(undefined);

    render(<GuideOfferQaPanel offerId="offer-1" />);

    expect(await screen.findByText("Можно начать позже?")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ваш ответ..."), {
      target: { value: "Да, можем." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ответить" }));

    await waitFor(() => {
      expect(getQaPanelDataAction).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Да, можем.")).toBeInTheDocument();
  });
});
