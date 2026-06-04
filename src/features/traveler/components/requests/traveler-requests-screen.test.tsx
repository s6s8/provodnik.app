import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  ConfirmedBookingSummary,
  JoinedGroupSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import { TravelerRequestsScreen } from "./traveler-requests-screen";

beforeEach(() => {
  window.localStorage.clear();
});

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

describe("TravelerRequestsScreen — view toggle / category tabs", () => {
  it("renders view toggle buttons when trips exist and defaults to the feed", () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[]}
      />,
    );

    expect(screen.getByRole("button", { name: /Лента/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /По категориям/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("reveals category tabs with counts after switching views", () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[baseBooking]}
        joinedGroups={[baseJoinedGroup]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /По категориям/i }));

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Активные \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Мои группы \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Подтверждённые \(1\)/i }),
    ).toBeInTheDocument();
  });

  it("shows active trips first and joined groups after switching tabs", () => {
    render(
      <TravelerRequestsScreen
        activeRequests={[baseRequest]}
        confirmedBookings={[]}
        joinedGroups={[baseJoinedGroup]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /По категориям/i }));

    expect(screen.getByText("Элиста")).toBeInTheDocument();
    expect(screen.queryByText("Кострома")).toBeNull();

    const joinedTab = screen.getByRole("tab", { name: /Мои группы \(1\)/i });
    fireEvent.pointerDown(joinedTab, {
      button: 0,
      ctrlKey: false,
      pointerType: "mouse",
    });
    fireEvent.click(joinedTab);

    expect(screen.getByText("Кострома")).toBeInTheDocument();
  });

  it("renders only the empty cabinet when there are no trips", () => {
    render(
      <TravelerRequestsScreen activeRequests={[]} confirmedBookings={[]} />,
    );

    expect(screen.queryByRole("button", { name: /Лента/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /По категориям/i })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
