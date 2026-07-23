import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { ChatWindow } from "./chat-window";

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/features/messaging/hooks/use-realtime-messages", () => ({
  useRealtimeMessages: vi.fn(),
  mergeRealtimeMessage: vi.fn(),
}));

function renderChat(props: Partial<ComponentProps<typeof ChatWindow>> = {}) {
  return render(
    <ChatWindow
      threadId="thread-1"
      currentUserId="user-1"
      initialMessages={[]}
      markReadAction={async () => {}}
      {...props}
    />,
  );
}

describe("ChatWindow load states", () => {
  it("shows an error state instead of an empty thread when loading failed", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderChat({ loadError: true });

    expect(screen.getByText("Не удалось загрузить")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Обновить" })).toBeInTheDocument();
    expect(screen.queryByText("Нет сообщений")).not.toBeInTheDocument();
  });

  it("shows the genuine empty state when there are no messages", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderChat();

    expect(screen.getByText("Нет сообщений")).toBeInTheDocument();
    expect(screen.queryByText("Не удалось загрузить")).not.toBeInTheDocument();
  });

  it("shows an error state when the client refetch fails", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderChat();

    expect(screen.getByText("Не удалось загрузить")).toBeInTheDocument();
    expect(screen.queryByText("Нет сообщений")).not.toBeInTheDocument();
  });
});
