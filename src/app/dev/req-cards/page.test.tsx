import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import DevReqCardsPage from "./page";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
});

describe("/dev/req-cards", () => {
  it("renders only the themes-on-top prototype bundle", () => {
    render(<DevReqCardsPage />);

    expect(screen.getByRole("heading", { name: "1 · Темы наверху, чистый низ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "5 · Контур: цвет рамки = тип" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "6 · Аватары + счётчик участников" })).not.toBeInTheDocument();
  });

  it("renders theme words in the top label row", () => {
    render(<DevReqCardsPage />);

    const section = screen.getByRole("heading", { name: "1 · Темы наверху, чистый низ" }).closest("section");
    expect(section).not.toBeNull();

    const tbilisiLink = within(section!).getByRole("link", { name: /Тбилиси/ });

    expect(within(tbilisiLink).getByText("История и культура")).toBeInTheDocument();
    expect(within(tbilisiLink).getByText("Гастрономия")).toBeInTheDocument();
  });

  it("renders participant counts without capacity text in the bottom row", () => {
    render(<DevReqCardsPage />);

    const countSection = screen.getByRole("heading", { name: "1 · Темы наверху, чистый низ" }).closest("section");

    expect(countSection).not.toBeNull();

    const soloCard = within(countSection!)
      .getByRole("link", { name: /Мцхета/ })
      .closest("article");
    const largeCard = within(countSection!)
      .getByRole("link", { name: /Кахетия/ })
      .closest("article");

    expect(soloCard).not.toBeNull();
    expect(largeCard).not.toBeNull();

    expect(within(soloCard!).getAllByTestId("participant-avatar")).toHaveLength(1);
    expect(within(soloCard!).queryByText("1")).not.toBeInTheDocument();
    expect(within(largeCard!).getAllByTestId("participant-avatar")).toHaveLength(3);
    expect(within(largeCard!).getByText("40")).toBeInTheDocument();
    expect(within(countSection!).queryByText("из")).not.toBeInTheDocument();
    expect(countSection).not.toHaveTextContent("/");
  });
});
