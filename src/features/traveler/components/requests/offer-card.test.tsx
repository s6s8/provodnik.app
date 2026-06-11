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
  traveler_read_at: null,
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

  it("does not flag equal HH:MM and HH:MM:SS times as deviations", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          starts_at: "2026-06-01T09:30:00+03:00",
          ends_at: "2026-06-01T11:00:00+03:00",
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerTimeLocked={false}
        travelerStartTime="09:30:00"
        travelerEndTime="11:00:00"
      />,
    );

    expect(screen.queryByText(/гид предложил 09:30/)).not.toBeInTheDocument();
  });

  it("renders counter-offer arrow badges for changed conditions only", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          price_minor: 1200000,
          capacity: 2,
          starts_at: "2026-06-15T10:30:00+03:00",
          ends_at: "2026-06-15T12:00:00+03:00",
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerDateLocked={false}
        travelerTimeLocked={false}
        travelerCountLocked={false}
        travelerBudgetLocked={false}
        travelerStartsOn={null}
        travelerStartTime="09:00:00"
        travelerEndTime="12:00:00"
        travelerCount={3}
        travelerBudgetPerPersonRub={5000}
      />,
    );

    expect(screen.getByText("Гид предложил другие условия")).toBeInTheDocument();
    expect(screen.getByText("Дата: гибкая → 15 июня")).toBeInTheDocument();
    expect(screen.getByText("Людей: 3 чел. → 2 чел.")).toBeInTheDocument();
    expect(screen.getByText("Время: 09:00 → 10:30")).toBeInTheDocument();
    expect(screen.getByText((_content, element) => (
      element?.getAttribute("data-slot") === "badge" &&
      (element.textContent?.replace(/\s/g, " ").includes("Цена: 5 000 ₽ → 6 000 ₽/чел") ?? false)
    ))).toBeInTheDocument();
    expect(screen.getByText((_content, element) => (
      element?.getAttribute("data-slot") === "badge" &&
      (element.textContent?.replace(/\s/g, " ").includes("12 000 ₽ за группу") ?? false)
    ))).toHaveClass("border-success/30", "bg-success/10", "text-success");
  });

  it("does not render the counter-offer row when conditions match", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          price_minor: 1000000,
          capacity: 2,
          starts_at: "2026-06-15T09:00:00+03:00",
          ends_at: "2026-06-15T12:00:00+03:00",
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerDateLocked={false}
        travelerTimeLocked={false}
        travelerCountLocked={false}
        travelerBudgetLocked={false}
        travelerStartsOn="2026-06-15"
        travelerStartTime="09:00:00"
        travelerEndTime="12:00:00"
        travelerCount={2}
        travelerBudgetPerPersonRub={5000}
      />,
    );

    expect(screen.queryByText("Гид предложил другие условия")).not.toBeInTheDocument();
    expect(screen.queryByText(/Дата:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Людей:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Цена:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Время:/)).not.toBeInTheDocument();
  });
});
