import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  createSupabaseServerClientMock,
  getDestinationsMock,
  getActiveRequestsMock,
  getConfirmedBookingsMock,
  getJoinedRequestsMock,
  pinElistaInspirationsMock,
  redirectMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getDestinationsMock: vi.fn(),
  getActiveRequestsMock: vi.fn(),
  getConfirmedBookingsMock: vi.fn(),
  getJoinedRequestsMock: vi.fn(),
  pinElistaInspirationsMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/data/supabase/queries", () => ({
  getDestinations: getDestinationsMock,
}));

vi.mock("@/lib/supabase/traveler-requests", () => ({
  getActiveRequests: getActiveRequestsMock,
  getConfirmedBookings: getConfirmedBookingsMock,
  getJoinedRequests: getJoinedRequestsMock,
}));

vi.mock("@/features/traveler/components/empty-cabinet/pin-elista", () => ({
  pinElistaInspirations: pinElistaInspirationsMock,
}));

vi.mock("@/features/traveler/components/requests/traveler-requests-screen", () => ({
  TravelerRequestsScreen: ({
    activeRequests,
    confirmedBookings,
    joinedGroups,
    inspirations,
  }: {
    activeRequests: Array<{ destination: string }>;
    confirmedBookings: Array<{ destination: string }>;
    joinedGroups: Array<{ destination: string }>;
    inspirations: Array<{ title: string }>;
  }) => (
    <section aria-label="trips">
      <h1>TravelerRequestsScreen</h1>
      <p>request: {activeRequests[0]?.destination}</p>
      <p>booking: {confirmedBookings[0]?.destination}</p>
      <p>joined: {joinedGroups[0]?.destination}</p>
      <p>inspiration: {inspirations[0]?.title}</p>
    </section>
  ),
}));

import TripsPage, { metadata } from "./page";

function signedInSupabase(userId: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
  };
}

describe("TripsPage", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    getDestinationsMock.mockReset();
    getActiveRequestsMock.mockReset();
    getConfirmedBookingsMock.mockReset();
    getJoinedRequestsMock.mockReset();
    pinElistaInspirationsMock.mockReset();
    redirectMock.mockClear();
  });

  it("uses the traveler home metadata title", () => {
    expect(metadata).toEqual({
      title: "Кабинет путешественника",
      alternates: {
        canonical: "/trips",
      },
    });
  });

  it("redirects anonymous travelers to auth with the trips return path", async () => {
    createSupabaseServerClientMock.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    await expect(TripsPage()).rejects.toThrow("NEXT_REDIRECT:/auth?next=/trips");
    expect(redirectMock).toHaveBeenCalledWith("/auth?next=/trips");
    expect(getActiveRequestsMock).not.toHaveBeenCalled();
  });

  it("renders requests, bookings, joined groups, and inspirations for the signed-in traveler", async () => {
    const supabase = signedInSupabase("traveler-1");
    createSupabaseServerClientMock.mockResolvedValueOnce(supabase);
    getActiveRequestsMock.mockResolvedValueOnce([{ destination: "Элиста" }]);
    getConfirmedBookingsMock.mockResolvedValueOnce([{ destination: "Москва" }]);
    getJoinedRequestsMock.mockResolvedValueOnce([{ destination: "Кострома" }]);
    getDestinationsMock.mockResolvedValueOnce({ data: [{ title: "Элиста" }] });
    pinElistaInspirationsMock.mockReturnValueOnce([{ title: "Калмыкия" }]);

    const ui = await TripsPage();
    render(ui);

    expect(getActiveRequestsMock).toHaveBeenCalledWith("traveler-1");
    expect(getConfirmedBookingsMock).toHaveBeenCalledWith("traveler-1");
    expect(getJoinedRequestsMock).toHaveBeenCalledWith("traveler-1");
    expect(getDestinationsMock).toHaveBeenCalledWith(supabase);
    expect(pinElistaInspirationsMock).toHaveBeenCalledWith([{ title: "Элиста" }]);
    expect(
      screen.getByRole("heading", { name: "TravelerRequestsScreen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("request: Элиста")).toBeInTheDocument();
    expect(screen.getByText("booking: Москва")).toBeInTheDocument();
    expect(screen.getByText("joined: Кострома")).toBeInTheDocument();
    expect(screen.getByText("inspiration: Калмыкия")).toBeInTheDocument();
  });
});
