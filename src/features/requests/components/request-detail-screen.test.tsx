import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import type { QaThread } from "@/lib/supabase/qa-threads";
import type { GuideOfferRow, TravelerRequestRow } from "@/lib/supabase/types";

import {
  RequestDetailScreen,
  type PublicRequestDetailViewModel,
} from "./request-detail-screen";

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, title, className }: { children: React.ReactNode; title?: string; className?: string }) => (
    <div title={title} className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: { src?: string; alt: string }) =>
    src ? <span role="img" aria-label={alt} data-src={src} /> : null,
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock("@/features/requests/components/join-group-button", () => ({
  JoinGroupButton: ({ className }: { requestId: string; className?: string }) => (
    <button type="button" className={className}>
      Присоединиться к группе
    </button>
  ),
}));

vi.mock("@/features/guide/components/requests/bid-form-panel-lazy", () => ({
  BidFormPanel: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      submit mocked offer
    </button>
  ),
}));

vi.mock("@/features/guide/components/requests/guide-offer-qa-panel", () => ({
  GuideOfferQaPanel: ({ offerId }: { offerId: string }) => (
    <div data-testid="guide-qa-panel">Q&A for {offerId}</div>
  ),
}));

vi.mock("@/features/traveler/components/requests/accept-offer-button", () => ({
  AcceptOfferButton: () => <button type="button">Принять предложение</button>,
}));

vi.mock("@/features/traveler/components/requests/reject-offer-button", () => ({
  RejectOfferButton: () => <button type="button">Отклонить</button>,
}));

vi.mock("@/features/traveler/components/requests/offer-qa-sheet", () => ({
  OfferQaSheet: () => <button type="button">Задать вопрос</button>,
}));

vi.mock("@/features/traveler/components/requests/cancel-request-button", () => ({
  CancelRequestButton: () => <button type="button">Отменить запрос</button>,
}));

vi.mock("@/features/traveler/components/requests/mark-offers-read", () => ({
  MarkOffersRead: () => <span data-testid="mark-offers-read" />,
}));

const publicViewModel: PublicRequestDetailViewModel = {
  title: "Элиста",
  regionLabel: "Калмыкия · Россия",
  cityImageUrl: "https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1800&q=80",
  dateLabel: "25 июня",
  timeLabel: "14:00",
  datesFlexible: true,
  pricePerPersonRub: 3000,
  memberCount: 4,
  members: [
    { id: "u1", displayName: "Айгуль", initials: "А" },
    { id: "u2", displayName: "Мария", initials: "М" },
  ],
  organizerName: "Айгуль",
  themes: ["history_culture", "nature"],
  notes: "Едем небольшой компанией по Калмыкии.",
  joinState: "anon",
};

const travelerRecord: TravelerRequestRecord = {
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

const travelerRequestRow = {
  id: "request-1",
  status: "open",
  date_locked: true,
  time_locked: true,
  count_locked: true,
  budget_locked: true,
  starts_on: "2026-06-10",
  start_time: null,
  end_time: null,
  open_to_join: false,
  participants_count: 2,
  budget_minor: null,
} as TravelerRequestRow;

const offer = {
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
  message: "Покажу город и главные места.",
  inclusions: [],
  expires_at: null,
  route_stops: [],
  route_duration_minutes: null,
  traveler_read_at: null,
  created_at: "2026-06-04T09:00:00.000Z",
  updated_at: "2026-06-04T09:00:00.000Z",
} satisfies GuideOfferRow;

const guideRequest: RequestRecord = {
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

describe("RequestDetailScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the owner guide comparison with select→accept and not the guide bid form", () => {
    render(
      <RequestDetailScreen
        viewerRole="owner"
        requestId="request-1"
        ownerRecord={travelerRecord}
        ownerRequestRow={travelerRequestRow}
        viewModel={publicViewModel}
        ownerOffers={[
          {
            offer,
            guideInfo: {
              guide_id: "guide-1",
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

    // New immersive comparison: heading + per-card select, no guide bid form
    expect(screen.getByText(/Кто покажет вам/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сделать предложение" })).not.toBeInTheDocument();

    // Accept commits from the sticky bar, which appears only after selecting a guide
    expect(screen.queryByRole("button", { name: "Принять предложение" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Выбрать гида" }));
    expect(screen.getByRole("button", { name: "Принять предложение" })).toBeInTheDocument();
  });

  it("renders the guide bid form control and not owner accept controls", () => {
    render(
      <RequestDetailScreen
        viewerRole="guide"
        request={guideRequest}
        isApproved
        existingOfferId={null}
        competingOffers={0}
        viewsCount={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Сделать предложение" }));

    expect(screen.getByRole("button", { name: "submit mocked offer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Принять предложение" })).not.toBeInTheDocument();
  });

  it("renders the public login CTA and neither owner offers nor guide bid form", () => {
    render(
      <RequestDetailScreen
        viewerRole="public"
        requestId="request-1"
        viewModel={publicViewModel}
      />,
    );

    expect(screen.getAllByText("Войти и присоединиться")).toHaveLength(1);
    expect(screen.getByText("Присоединиться")).toBeInTheDocument();
    expect(screen.queryByText("Предложения гидов")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сделать предложение" })).not.toBeInTheDocument();
  });

  it("preserves the public сборная join page contract without deleted sections", () => {
    render(
      <RequestDetailScreen
        viewerRole="public"
        requestId="request-1"
        viewModel={{ ...publicViewModel, joinState: "can-join" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Элиста" })).toBeInTheDocument();
    expect(screen.getAllByText("Присоединиться к группе").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Кто едет")).toBeInTheDocument();
    expect(screen.getByText("Как это работает")).toBeInTheDocument();

    expect(screen.queryByText("Сборная группа")).not.toBeInTheDocument();
    expect(screen.queryByText(/мест занято/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Стоимость на человека/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/О маршруте/i)).not.toBeInTheDocument();
  });

  it("preserves owner request badges in canonical group-date-time-count-budget order", () => {
    render(
      <RequestDetailScreen
        viewerRole="owner"
        requestId="request-1"
        ownerRecord={{
          ...travelerRecord,
          request: { ...travelerRecord.request, dateFlexibility: "few_days" },
        }}
        ownerRequestRow={travelerRequestRow}
        viewModel={publicViewModel}
        ownerOffers={[]}
        onSendQa={async () => {}}
        onGetOrCreateQaThread={async () => "thread-1"}
      />,
    );

    const groupBadge = screen.getByText("Сборная группа").closest("[data-slot='badge']");
    const badges = Array.from(groupBadge?.parentElement?.querySelectorAll("[data-slot='badge']") ?? []);
    const badgeTexts = badges.map((badge) => badge.textContent);

    expect(badgeTexts).toEqual([
      "Сборная группа",
      "10 июня 2026",
      "±пара дней",
      "—",
      "2 из 5 чел.",
      "Бюджет не указан",
    ]);
  });

  it("refreshes after guide offer submission without mounting Q&A with a placeholder offer id", () => {
    render(
      <RequestDetailScreen
        viewerRole="guide"
        request={guideRequest}
        isApproved
        existingOfferId={null}
        competingOffers={0}
        viewsCount={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Сделать предложение" }));
    fireEvent.click(screen.getByRole("button", { name: "submit mocked offer" }));

    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("guide-qa-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Q&A for pending")).not.toBeInTheDocument();
  });
});
