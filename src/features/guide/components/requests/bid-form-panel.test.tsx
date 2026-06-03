import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

vi.mock("@/app/(protected)/guide/inbox/[requestId]/offer/actions", () => ({
  submitOfferAction: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  }),
}));

vi.mock("@/data/guide-assets/supabase-client", () => ({
  listGuideLocationPhotos: async () => [],
}));

import { BidFormPanel } from "./bid-form-panel";

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
