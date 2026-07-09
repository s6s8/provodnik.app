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
  rating: 4.8,
  review_count: 12,
  verified: true,
  years_experience: 7,
  trips_completed: 34,
  recommend_pct: 96,
  languages: ["Русский", "Английский"],
  specialties: ["История", "Культура"],
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
        travelerOpenToJoin={false}
      />,
    );
    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
  });

  it("always renders the group type badge first with canonical color", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          starts_at: "2026-06-15T10:30:00+03:00",
          ends_at: "2026-06-15T12:00:00+03:00",
          capacity: 2,
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerStartsOn="2026-06-15"
        travelerOpenToJoin={true}
        travelerCount={2}
        travelerBudgetPerPersonRub={2500}
      />,
    );

    const groupBadge = screen.getByText("Сборная группа").closest("[data-slot='badge']");
    const badges = Array.from(groupBadge?.parentElement?.querySelectorAll("[data-slot='badge']") ?? []);
    const badgeTexts = badges.map((badge) => badge.textContent);

    expect(groupBadge).toHaveClass("border-primary/20", "bg-primary-tint", "text-primary");
    expect(badgeTexts).toEqual([
      "Сборная группа",
      "15 июня",
      "10:30 – 12:00",
      "2 чел.",
      "5 000 ₽ за группу · 2 500 ₽ на чел.",
    ]);
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
        travelerOpenToJoin={false}
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
        travelerOpenToJoin={false}
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
        travelerOpenToJoin={false}
      />,
    );

    expect(screen.queryByText(/гид предложил 09:30/)).not.toBeInTheDocument();
  });

  it("warns when a locked traveler date differs from the guide offer date", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          starts_at: "2026-07-24T08:00:00+00:00",
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerDateLocked={true}
        travelerTimeLocked={true}
        travelerCountLocked={true}
        travelerBudgetLocked={true}
        travelerStartsOn="2026-06-24"
        travelerOpenToJoin={false}
        travelerCount={1}
        travelerBudgetPerPersonRub={5000}
      />,
    );

    expect(screen.getByText("Гид предложил другие условия")).toBeInTheDocument();
  });

  it("does not warn when locked traveler conditions match the guide offer", () => {
    render(
      <OfferCard
        offer={{
          ...baseOffer,
          starts_at: "2026-06-24T08:00:00+00:00",
        }}
        guideInfo={guideInfo}
        qaThread={null}
        requestId="req-1"
        requestStatus="open"
        onSendQa={onSendQa}
        onGetOrCreateQaThread={onGetOrCreateQaThread}
        travelerDateLocked={true}
        travelerTimeLocked={true}
        travelerCountLocked={true}
        travelerBudgetLocked={true}
        travelerStartsOn="2026-06-24"
        travelerOpenToJoin={false}
        travelerCount={1}
        travelerBudgetPerPersonRub={5000}
      />,
    );

    expect(screen.queryByText("Гид предложил другие условия")).not.toBeInTheDocument();
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
        travelerOpenToJoin={false}
        travelerCount={3}
        travelerBudgetPerPersonRub={5000}
      />,
    );

    expect(screen.getByText("Гид предложил другие условия")).toBeInTheDocument();
    // Гибкие даты — бейдж появляется когда travelerStartsOn=null
    expect(screen.getByText("Гибкие даты")).toBeInTheDocument();
    // Дата-бейдж (следующий после типа группы и "Гибкие даты") — синий (не error-семантика)
    const groupBadge = screen.getByText(/Своя группа · 3 чел\./).closest("[data-slot='badge']");
    const badges = Array.from(groupBadge?.parentElement?.querySelectorAll("[data-slot='badge']") ?? []);
    const badgeTexts = badges.map((badge) => badge.textContent);
    const dateBadge = badges[2];

    expect(badgeTexts).toEqual([
      "Своя группа · 3 чел.",
      "Гибкие даты",
      "15 июня",
      "10:30 – 12:00",
      "2 чел.",
      "12 000 ₽ за группу · 6 000 ₽ на чел.",
    ]);
    expect(groupBadge).toHaveClass("border-border", "bg-surface-low", "text-muted-foreground");
    expect(dateBadge).toHaveClass("border-amber/40", "bg-amber-tint", "text-amber");
    // Нет стрелочных бейджей старого формата
    expect(screen.queryByText(/гибкая →/)).not.toBeInTheDocument();
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
        travelerOpenToJoin={false}
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
