import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TravelerRequestRecord } from "@/data/traveler-request/types";

import { TravelerRequestDetailScreen } from "./traveler-request-detail-screen";

const baseRecord: TravelerRequestRecord = {
  id: "request-1",
  status: "submitted",
  createdAt: "2026-06-01T00:00:00.000Z",
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
  it("uses openToJoin for the open-group badge and shows unset budget honestly", () => {
    render(<TravelerRequestDetailScreen record={baseRecord} />);

    expect(screen.queryByText("Открытая группа")).not.toBeInTheDocument();
    expect(screen.getByText("Бюджет не указан")).toBeInTheDocument();
  });

  it("shows open-group badge when the request is actually open to join", () => {
    render(
      <TravelerRequestDetailScreen
        record={{
          ...baseRecord,
          request: { ...baseRecord.request, openToJoin: true },
        }}
      />,
    );

    expect(screen.getByText("Открытая группа")).toBeInTheDocument();
  });
});
