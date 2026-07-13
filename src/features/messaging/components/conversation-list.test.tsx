import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { ConversationList } from "./conversation-list";

function renderWith(role: string | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConversationList initialThreads={[]} viewerRole={role} />
    </QueryClientProvider>,
  );
}

describe("ConversationList empty state", () => {
  it("shows traveler-oriented copy for a traveler", () => {
    renderWith("traveler");
    expect(
      screen.getByText("Здесь появятся переписки с гидами."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Создать запрос" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows guide-oriented copy for a guide", () => {
    renderWith("guide");
    expect(
      screen.getByText("Здесь появятся переписки с путешественниками."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Создать запрос" }),
    ).not.toBeInTheDocument();
  });

  it("offers a retry action when loading failed", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <ConversationList initialThreads={[]} error viewerRole="traveler" />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Не удалось загрузить")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Обновить" }),
    ).toBeInTheDocument();
  });
});
