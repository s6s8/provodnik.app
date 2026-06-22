import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, notFoundMock, redirectMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  notFoundMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/features/bookings/components/BookingFormTabs", () => ({
  BookingFormTabs: () => <div>Форма заявки</div>,
}));

import BookingPage, { metadata } from "./page";

const listing = {
  id: "listing-1",
  guide_id: "guide-1",
  title: "Прогулка по Карелии",
  region: "Карелия",
  price_from_minor: 500000,
  currency: "RUB",
  max_group_size: 8,
  format: "group",
  category: "nature",
  status: "published",
  image_url: null,
};

function makeBuilder(result: { data: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

function mockClient(guidePublic: unknown) {
  createSupabaseServerClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "traveler-1" } }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === "listings") return makeBuilder({ data: listing });
      if (table === "v_guide_public_profile") return makeBuilder({ data: guidePublic });
      return makeBuilder({ data: null });
    }),
  });
}

describe("BookingPage honest title + trust", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    notFoundMock.mockReset();
    redirectMock.mockReset();
  });

  it("uses the honest «Подать заявку» metadata title, not «Оформление»", () => {
    expect(String(metadata.title)).toContain("Подать заявку");
    expect(String(metadata.title)).not.toContain("Оформление");
  });

  it("renders the honest heading, MoneyBreakdown, and guide identity", async () => {
    mockClient({ full_name: "Ирина Петрова", average_rating: 4.9, review_count: 12 });

    const ui = await BookingPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(ui);

    expect(
      screen.getByRole("heading", { name: /Подать заявку/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Оформление/ })).not.toBeInTheDocument();
    expect(
      screen.getByText("Оплата напрямую гиду при встрече. Проводник не обрабатывает оплату."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ирина Петрова")).toBeInTheDocument();
  });

  it("falls back to «Проверенный гид» when the public guide row is missing", async () => {
    mockClient(null);

    const ui = await BookingPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(ui);

    expect(screen.getByText("Проверенный гид")).toBeInTheDocument();
  });
});
