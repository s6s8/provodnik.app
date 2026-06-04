import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

const { submitOfferAction, verificationStatus } = vi.hoisted(() => ({
  submitOfferAction: vi.fn(),
  verificationStatus: { value: "approved" as string | null },
}));

vi.mock("@/app/(protected)/guide/inbox/[requestId]/offer/actions", () => ({
  submitOfferAction,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "guide-1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { verification_status: verificationStatus.value },
            error: null,
          }),
        }),
      }),
    }),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  }),
}));

vi.mock("@/data/guide-assets/supabase-client", () => ({
  listGuideLocationPhotos: async () => [],
}));

import { BidFormPanel } from "./bid-form-panel";

beforeEach(() => {
  vi.clearAllMocks();
  verificationStatus.value = "approved";
  submitOfferAction.mockResolvedValue({ ok: true, offerId: "offer-1" });
});

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

describe("BidFormPanel — mode line", () => {
  it("renders text line for assembly mode without the colored pill", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, mode: "assembly" }}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText("К запросу могут присоединяться другие путешественники"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Открытая группа$/)).toBeNull();
  });

  it("renders text line for private mode with N count", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, mode: "private", groupSize: 4 }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Группа закрытая — только 4 человек")).toBeInTheDocument();
    expect(screen.queryByText(/^Своя группа$/)).toBeNull();
  });
});

describe("BidFormPanel — date/time locks", () => {
  it("disables date and time fields when date_locked/time_locked are true", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, date_locked: true, time_locked: true }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText(/Дата/)).toBeDisabled();
    expect(screen.getByLabelText(/Время начала/)).toBeDisabled();
    expect(screen.getByText("путешественник просит строго эту дату")).toBeInTheDocument();
  });

  it("shows hint above date when both locks are off", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, date_locked: false, time_locked: false }}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText("путешественник открыт к близким датам и времени"),
    ).toBeInTheDocument();
  });
});

describe("BidFormPanel — headcount field", () => {
  it("does not render the «предложено» badge when headcount changes", () => {
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, groupSize: 4 }}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "5" },
    });

    expect(screen.queryByText(/предложено/i)).toBeNull();
  });
});

describe("BidFormPanel — verification gate", () => {
  it("does not submit an offer when the guide is not approved", async () => {
    verificationStatus.value = "submitted";
    render(
      <BidFormPanel
        requestId="req-1"
        request={{ ...baseRequest, budgetRub: 1500 }}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("Сообщение гостю"), {
      target: { value: "Готов провести маршрут по вашему запросу." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить предложение" }));

    expect(
      await screen.findByText("Предложения доступны только после одобрения профиля гида."),
    ).toBeInTheDocument();
    expect(submitOfferAction).not.toHaveBeenCalled();
  });
});
