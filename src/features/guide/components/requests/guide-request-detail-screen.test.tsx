import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./bid-form-panel", () => ({
  BidFormPanel: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      submit mocked offer
    </button>
  ),
}));

vi.mock("./guide-offer-qa-panel", () => ({
  GuideOfferQaPanel: ({ offerId }: { offerId: string }) => (
    <div data-testid="qa-panel">Q&A for {offerId}</div>
  ),
}));

import { GuideRequestDetailScreen } from "./guide-request-detail-screen";

const baseRequest: RequestRecord = {
  id: "req-1",
  destination: "Сочи",
  destinationSlug: "sochi",
  destinationRegion: "Юг",
  title: "Тестовый запрос",
  dateLabel: "10 июня",
  startsOn: "2026-06-10",
  endsOn: null,
  startTime: null,
  endTime: null,
  groupSize: 2,
  capacity: 2,
  budgetRub: 0,
  budgetLabel: "—",
  requesterName: "Тест",
  requesterInitials: "Т",
  description: "",
  interests: [],
  mode: "assembly",
  format: "tour",
  status: "open",
  createdAt: "2026-01-01T00:00:00Z",
  offerCount: 0,
  imageUrl: "",
  members: [],
};

describe("GuideRequestDetailScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes after offer submission without mounting Q&A with a placeholder offer id", () => {
    render(
      <GuideRequestDetailScreen
        request={baseRequest}
        isApproved
        existingOfferId={null}
        competingOffers={0}
        viewsCount={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Сделать предложение" }));
    fireEvent.click(screen.getByRole("button", { name: "submit mocked offer" }));

    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("qa-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Q&A for pending")).not.toBeInTheDocument();
  });
});
