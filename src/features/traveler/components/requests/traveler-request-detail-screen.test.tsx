import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TravelerRequestRecord } from "@/data/traveler-request/types";

import { TravelerRequestDetailScreen } from "./traveler-request-detail-screen";

const baseRecord: TravelerRequestRecord = {
  id: "request-1",
  status: "submitted",
  createdAt: "2026-06-03T10:25:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  request: {
    mode: "assembly",
    interests: ["history_culture"],
    requestedLanguages: [],
    destination: "Элиста",
    startDate: "2026-06-10",
    dateFlexibility: "exact",
    groupSizeCurrent: 2,
    groupMax: 5,
    openToJoin: false,
    allowGuideSuggestionsOutsideConstraints: true,
    budgetPerPersonRub: undefined as unknown as number,
    notes: "",
  },
};

describe("TravelerRequestDetailScreen", () => {
  it("shows the publication date below the badges and unset budget honestly", () => {
    render(<TravelerRequestDetailScreen record={baseRecord} />);

    const publishedAt = screen.getByText(/^Опубликован 3 июня 2026 г?., 14:25$/);
    expect(publishedAt).toHaveClass("text-xs", "text-muted-foreground");
    expect(screen.getByText("Сборная группа")).toBeInTheDocument();
    expect(screen.getByText("Бюджет не указан")).toBeInTheDocument();
  });

  it("frames the main request detail card", () => {
    render(<TravelerRequestDetailScreen record={baseRecord} />);

    const detailCard = screen.getByRole("heading", { name: "Элиста" }).closest(".rounded-lg");
    expect(detailCard).toHaveClass("rounded-lg", "border", "bg-card", "p-4");
  });

  it("does not show a redundant open-group badge for an assembly request", () => {
    render(
      <TravelerRequestDetailScreen
        record={{
          ...baseRecord,
          request: { ...baseRecord.request, openToJoin: true },
        }}
      />,
    );

    expect(screen.getByText("Сборная группа")).toBeInTheDocument();
    expect(screen.queryByText("Открытая группа")).not.toBeInTheDocument();
  });
});
