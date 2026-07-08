import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import type { QaThread } from "@/lib/supabase/qa-threads";
import type { GuideOfferRow, TravelerRequestRow } from "@/lib/supabase/types";

import {
  RequestDetailScreen,
  type PublicRequestDetailViewModel,
} from "@/features/requests/components/request-detail-screen";

const {
  createSupabaseServerClient,
  getRequestById,
  isRequestMember,
  hasSupabaseEnv,
  cityImage,
  notFound,
  redirect,
  viewerRoleForRequest,
  getRequestViewerContext,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getRequestById: vi.fn(),
  isRequestMember: vi.fn(),
  hasSupabaseEnv: vi.fn(),
  cityImage: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  viewerRoleForRequest: vi.fn(async () => "public"),
  getRequestViewerContext: vi.fn(async () => ({
    role: "public",
    userId: "viewer",
    authReadFailed: false,
  })),
}));

vi.mock("next/navigation", () => ({
  notFound,
  redirect,
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/viewer-role-for-request", () => ({
  viewerRoleForRequest,
  getRequestViewerContext,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getRequestById,
}));

vi.mock("@/lib/supabase/request-members", () => ({
  isRequestMember,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv,
}));

vi.mock("@/lib/city-image", () => ({
  cityImage,
}));

// Client-render mocks for the confirm-gate test (no backend; the action is stubbed).
vi.mock("@/features/requests/owner-request-actions", () => ({
  acceptOfferAction: vi.fn(async () => ({ error: null })),
  rejectOfferAction: vi.fn(async () => ({ error: null })),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/features/traveler/components/requests/offer-card", () => ({
  OfferCard: () => <div data-testid="offer-card" />,
}));

vi.mock("@/features/traveler/components/requests/mark-offers-read", () => ({
  MarkOffersRead: () => <span data-testid="mark-offers-read" />,
}));

vi.mock("@/features/traveler/components/requests/cancel-request-button", () => ({
  CancelRequestButton: () => <button type="button">Отменить запрос</button>,
}));

import RequestDetailPage from "./page";

function requestRecord(overrides: Partial<RequestRecord>): RequestRecord {
  return {
    id: "request-1",
    destination: "Элиста",
    destinationSlug: "elista",
    destinationRegion: "Калмыкия · Россия",
    title: "Элиста",
    dateLabel: "25 июня",
    startsOn: "2026-06-25",
    endsOn: null,
    startTime: "14:00",
    endTime: null,
    groupSize: 4,
    capacity: null,
    budgetRub: 3000,
    budgetLabel: "3 000 ₽ / чел.",
    requesterName: "Айгуль",
    requesterInitials: "А",
    requesterAvatarUrl: null,
    description: "Едем небольшой компанией.",
    interests: ["history_culture", "nature"],
    mode: "assembly",
    format: "Сборная",
    status: "open",
    createdAt: "2026-06-01T00:00:00Z",
    offerCount: 0,
    imageUrl: "https://images.unsplash.com/photo-1",
    members: [
      { id: "owner", displayName: "Айгуль", initials: "А" },
      { id: "member", displayName: "Мария", initials: "М" },
    ],
    dateFlexibility: "few_days",
    ...overrides,
  };
}

describe("RequestDetailPage", () => {
  it("builds a сборная view-model with city image and can-join state", async () => {
    const supabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "viewer" } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { traveler_id: "owner" } }),
          })),
        })),
      })),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    getRequestById.mockResolvedValue({ data: requestRecord({ id: "assembly-request" }) });
    hasSupabaseEnv.mockReturnValue(true);
    isRequestMember.mockResolvedValue(false);
    cityImage.mockReturnValue("https://images.unsplash.com/photo-city");

    const rendered = await RequestDetailPage({
      params: Promise.resolve({ requestId: "assembly-request" }),
      searchParams: Promise.resolve({}),
    });

    expect(cityImage).toHaveBeenCalledWith("Элиста");
    expect(rendered.props.requestId).toBe("assembly-request");
    expect(rendered.props.viewModel).toMatchObject({
      title: "Элиста",
      regionLabel: "Калмыкия · Россия",
      cityImageUrl: "https://images.unsplash.com/photo-city",
      dateLabel: "25 июня",
      timeLabel: "14:00",
      datesFlexible: true,
      pricePerPersonRub: 3000,
      memberCount: 4,
      organizerName: "Айгуль",
      themes: ["history_culture", "nature"],
      notes: "Едем небольшой компанией.",
      joinState: "can-join",
    });
  });

  it("returns notFound for private requests", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getRequestById.mockResolvedValue({ data: requestRecord({ id: "private-request", mode: "private" }) });
    hasSupabaseEnv.mockReturnValue(false);

    await expect(
      RequestDetailPage({
        params: Promise.resolve({ requestId: "private-request" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("redirects a guide to their inbox instead of a public 404 for a missing request", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getRequestById.mockResolvedValue({ data: null });
    hasSupabaseEnv.mockReturnValue(false);
    viewerRoleForRequest.mockResolvedValueOnce("guide");

    await expect(
      RequestDetailPage({
        params: Promise.resolve({ requestId: "gone-request" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/guide/inbox");

    expect(redirect).toHaveBeenCalledWith("/guide/inbox");
  });

  it("redirects an owner/traveler to /trips instead of a public 404 for a missing request", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getRequestById.mockResolvedValue({ data: null });
    hasSupabaseEnv.mockReturnValue(false);
    viewerRoleForRequest.mockResolvedValueOnce("owner");

    await expect(
      RequestDetailPage({
        params: Promise.resolve({ requestId: "gone-request" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/trips");

    expect(redirect).toHaveBeenCalledWith("/trips");
  });
});

const ownerConfirmViewModel: PublicRequestDetailViewModel = {
  title: "Элиста",
  regionLabel: "Калмыкия · Россия",
  cityImageUrl: "https://example.com/eli.jpg",
  dateLabel: "25 июня",
  timeLabel: "14:00",
  datesFlexible: false,
  pricePerPersonRub: 3000,
  memberCount: 2,
  members: [{ id: "u1", displayName: "Айгуль", initials: "А" }],
  organizerName: "Айгуль",
  themes: [],
  notes: "",
  joinState: "owner",
};

const ownerConfirmRecord: TravelerRequestRecord = {
  id: "request-1",
  status: "submitted",
  createdAt: "2026-06-03T10:25:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  request: {
    mode: "assembly",
    interests: [],
    requestedLanguages: [],
    destination: "Элиста",
    startDate: "2026-06-10",
    dateFlexibility: "exact",
    startTime: "10:00",
    endTime: "18:00",
    groupSizeCurrent: 2,
    groupMax: 5,
    openToJoin: true,
    allowGuideSuggestionsOutsideConstraints: true,
    budgetPerPersonRub: 4000,
    notes: "",
  },
};

const ownerConfirmRow = {
  id: "request-1",
  status: "open",
  date_locked: true,
  time_locked: true,
  count_locked: true,
  budget_locked: true,
  starts_on: "2026-06-10",
  start_time: null,
  end_time: null,
  open_to_join: true,
  participants_count: 2,
  budget_minor: 400000,
} as TravelerRequestRow;

const ownerConfirmOffer = {
  id: "offer-1",
  guide_id: "guide-1",
  request_id: "request-1",
  listing_id: null,
  title: null,
  status: "pending",
  price_minor: 600000,
  currency: "RUB",
  capacity: 2,
  starts_at: "2026-06-10T10:00:00.000Z",
  ends_at: "2026-06-10T12:00:00.000Z",
  message: "Покажу город.",
  inclusions: [],
  expires_at: null,
  route_stops: [],
  route_duration_minutes: null,
  traveler_read_at: null,
  created_at: "2026-06-04T09:00:00.000Z",
  updated_at: "2026-06-04T09:00:00.000Z",
} satisfies GuideOfferRow;

describe("RequestDetailPage owner confirm gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts the useConfirm gate in OwnerDetailBranch: accepting opens a confirm dialog", async () => {
    render(
      <RequestDetailScreen
        viewerRole="owner"
        requestId="request-1"
        ownerRecord={ownerConfirmRecord}
        ownerRequestRow={ownerConfirmRow}
        viewModel={ownerConfirmViewModel}
        ownerOffers={[
          {
            offer: ownerConfirmOffer,
            guideInfo: {
              guide_id: "guide-1",
              slug: "anna-guide-1",
              full_name: "Анна",
              avatar_url: null,
              rating: 4.8,
              review_count: 12,
              verified: true,
              years_experience: 5,
              trips_completed: 21,
              recommend_pct: 94,
              languages: ["Русский"],
              specialties: ["Природа"],
            },
            qaThread: null as QaThread | null,
          },
        ]}
        onSendQa={async () => {}}
        onGetOrCreateQaThread={async () => "thread-1"}
      />,
    );

    // Select the guide → sticky action bar with the real accept button mounts
    fireEvent.click(screen.getByRole("button", { name: "Выбрать гида" }));
    fireEvent.click(screen.getByRole("button", { name: "Принять предложение" }));

    // The confirm gate (useConfirm/ConfirmDialog) is wired and opens before committing
    expect(await screen.findByText("Выбрать Анна?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Подтвердить выбор" }),
    ).toBeInTheDocument();
  });
});
