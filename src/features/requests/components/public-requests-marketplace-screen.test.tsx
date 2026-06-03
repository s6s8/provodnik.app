import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { PublicRequestsMarketplaceScreen } from "./public-requests-marketplace-screen";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
});

const request: OpenRequestRecord = {
  id: "request-1",
  status: "matched",
  visibility: "public",
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
  travelerRequestId: "traveler-request-1",
  group: {
    sizeTarget: 6,
    sizeCurrent: 2,
    openToMoreMembers: true,
  },
  destinationLabel: "Казань, Татарстан",
  regionLabel: "Татарстан",
  dateRangeLabel: "12 июня",
  budgetPerPersonRub: 4500,
  highlights: ["Исторический центр"],
  interests: ["history", "food"],
  members: [
    { id: "anna", displayName: "Анна", initials: "А" },
    { id: "max", displayName: "Максим", initials: "М" },
  ],
};

describe("PublicRequestsMarketplaceScreen", () => {
  it("maps open request records to the final request card design", () => {
    render(<PublicRequestsMarketplaceScreen initialData={[request]} />);

    const card = screen.getByRole("link", { name: /Казань/ });
    const article = card.closest("article");

    expect(card).toHaveAttribute("href", "/requests/request-1");
    expect(article).not.toBeNull();
    expect(within(article!).getByText("Казань")).toBeInTheDocument();
    expect(within(article!).getByText("12 июня")).toBeInTheDocument();
    expect(within(article!).getByText("Гид найден")).toBeInTheDocument();
    expect(within(article!).getByText("Открытая")).toBeInTheDocument();
    expect(within(article!).getByText(/4\s*500 ₽ \/ чел/)).toBeInTheDocument();
    expect(within(article!).getByRole("button", { name: "История" })).toBeInTheDocument();
    expect(within(article!).queryByText(/2\s*\/\s*6/)).not.toBeInTheDocument();
    expect(within(article!).queryByText("2 участников")).not.toBeInTheDocument();
  });
});
