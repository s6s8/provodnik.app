import { render, screen } from "@testing-library/react";
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
    expect(screen.queryByText(/^Сборная группа$/)).toBeNull();
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
