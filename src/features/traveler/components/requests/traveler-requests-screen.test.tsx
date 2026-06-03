import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  ConfirmedBookingSummary,
  JoinedGroupSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import { TravelerRequestsScreen } from "./traveler-requests-screen";

function isoDateFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

const baseRequest: TravelerRequestSummary = {
  id: "request-1",
  destination: "Элиста",
  region: "Калмыкия",
  interests: ["буддизм"],
  starts_on: isoDateFromNow(10),
  start_time: null,
  ends_on: null,
  budget_minor: null,
  participants_count: 2,
  status: "open",
  created_at: "2026-05-28T10:00:00.000Z",
  offer_count: 0,
  guide_avatars: [],
  mode: "private",
  group_max: null,
};

const baseBooking: ConfirmedBookingSummary = {
  booking_id: "booking-1",
  request_id: "request-1",
  destination: "Москва",
  starts_on: isoDateFromNow(7),
  price_minor: 2450000,
  currency: "RUB",
  guide_id: "guide-1",
  guide_name: "Демо Гид",
  guide_avatar_url: "/avatars/guide.jpg",
  booking_thread_id: null,
};

const baseJoinedGroup: JoinedGroupSummary = {
  id: "joined-group-1",
  destination: "Кострома",
  region: "Золотое кольцо",
  starts_on: isoDateFromNow(8),
  start_time: "11:00",
  ends_on: null,
  budget_minor: 1800000,
  participants_count: 3,
  group_max: 6,
  status: "open",
  joined_at: "2026-05-28T11:00:00.000Z",
  owner_id: "traveler-owner-1",
  owner_name: "Мария К.",
  owner_avatar_url: "/avatars/maria.jpg",
};

describe("TravelerRequestsScreen — lifecycle feed", () => {
  it("does not render a tablist", () => {
    render(
      <TravelerRequestsScreen activeRequests={[]} confirmedBookings={[]} />,
    );

    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("renders phase section headings in order when data is present", () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[
          {
            ...baseRequest,
            id: "awaiting-decision",
            destination: "Казань",
            offer_count: 2,
          },
          {
            ...baseRequest,
            id: "waiting-offers",
            destination: "Тула",
            offer_count: 0,
          },
        ]}
        confirmedBookings={[
          {
            ...baseBooking,
            booking_id: "upcoming-booking",
            request_id: "upcoming-request",
            destination: "Суздаль",
            starts_on: isoDateFromNow(5),
          },
          {
            ...baseBooking,
            booking_id: "completed-booking",
            request_id: "completed-request",
            destination: "Псков",
            starts_on: isoDateFromNow(-5),
          },
        ]}
      />,
    );

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      expect.stringMatching(/^СКОРО/i),
      expect.stringMatching(/^ЖДУТ ВАШЕГО РЕШЕНИЯ/i),
      expect.stringMatching(/^В ОЖИДАНИИ ОТКЛИКОВ/i),
      expect.stringMatching(/^ЗАВЕРШЁННЫЕ/i),
    ]);
  });

  it("omits sections with zero records (no «Сегодня» when nothing today)", () => {
    render(
      <TravelerRequestsScreen activeRequests={[]} confirmedBookings={[]} />,
    );

    expect(screen.queryByText(/СКОРО/i)).toBeNull();
  });

  it("renders joined assembly groups with the organizer in the upcoming phase", () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[]}
        confirmedBookings={[]}
        joinedGroups={[baseJoinedGroup]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /СКОРО · 1/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Кострома")).toBeInTheDocument();
    expect(
      screen.getByText("Сборная группа · организатор: Мария К."),
    ).toBeInTheDocument();
  });
});
