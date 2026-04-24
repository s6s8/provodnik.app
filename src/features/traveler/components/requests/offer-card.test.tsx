import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GuideOfferRow } from "@/lib/supabase/types";

vi.mock("@/lib/supabase/qa-threads", () => ({
  QA_MESSAGE_LIMIT: 8,
}));

vi.mock("./accept-offer-button", () => ({
  AcceptOfferButton: ({ offerId }: { offerId: string }) => (
    <button data-testid={`accept-${offerId}`}>Принять предложение</button>
  ),
}));

vi.mock("./offer-qa-sheet", () => ({
  OfferQaSheet: () => <button>Задать вопрос</button>,
}));

import { OfferCard } from "./offer-card";

const baseOffer: GuideOfferRow = {
  id: "offer-1",
  request_id: "req-1",
  guide_id: "guide-1",
  listing_id: null,
  title: null,
  message: null,
  price_minor: 500000,
  currency: "RUB",
  capacity: 1,
  starts_at: null,
  ends_at: null,
  inclusions: [],
  expires_at: null,
  status: "pending",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  route_stops: [],
  route_duration_minutes: null,
};

const guideInfo = {
  guide_id: "guide-1",
  full_name: "Иван Петров",
  avatar_url: null,
};

const onSendQa = vi.fn();
const onGetOrCreateQaThread = vi.fn();

describe("OfferCard", () => {
  it("renders the guide name", () => {
    render(
      <OfferCard
        offer={baseOffer}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
      />,
    );
    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
  });

  it('shows "Принять предложение" when requestStatus is open and offer is pending', () => {
    render(
      <OfferCard
        offer={baseOffer}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
      />,
    );
    expect(screen.getByText("Принять предложение")).toBeInTheDocument();
  });

  it('does NOT show "Принять предложение" when requestStatus is booked', () => {
    render(
      <OfferCard
        offer={baseOffer}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="booked"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
      />,
    );
    expect(screen.queryByText("Принять предложение")).not.toBeInTheDocument();
  });
});
