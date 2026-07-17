import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BookingWithDetails } from "@/lib/supabase/bookings";

import { BookingDetailScreen, BookingDetailSkeleton } from "./booking-detail-screen";

const { getGuideBookingDetailAction, refresh, push } = vi.hoisted(() => ({
  getGuideBookingDetailAction: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_DISPUTES: true,
  },
}));

vi.mock("@/features/bookings/components/cancel-booking-button", () => ({
  CancelBookingButton: () => <button type="button">Отменить бронирование</button>,
}));

vi.mock("@/features/disputes/components/open-dispute-button", () => ({
  OpenDisputeButton: () => <button type="button">Открыть спор</button>,
}));

vi.mock("@/features/reviews/components/FourAxisReviewForm", () => ({
  FourAxisReviewForm: ({ listingTitle }: { listingTitle: string }) => (
    <section>Оцените поездку: «{listingTitle}»</section>
  ),
}));

vi.mock("@/features/bookings/components/support-sidebar", () => ({
  SupportSidebar: ({ bookingId }: { bookingId: string }) => (
    <aside>Поддержка {bookingId}</aside>
  ),
}));

vi.mock("@/features/bookings/components/booking-ticket-trigger", () => ({
  BookingTicketTrigger: () => <button type="button">Билет поездки</button>,
}));

vi.mock("@/app/(protected)/guide/bookings/[bookingId]/actions", () => ({
  confirmBookingAction: vi.fn(),
  completeBookingAction: vi.fn(),
  getGuideBookingDetailAction,
}));

vi.mock("@/features/bookings/payment-agreement-actions", () => ({
  confirmPaymentAgreementAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const booking = {
  id: "booking-1",
  traveler_id: "traveler-1",
  guide_id: "guide-1",
  request_id: "request-1",
  offer_id: "offer-1",
  listing_id: "listing-1",
  status: "completed",
  party_size: 2,
  starts_at: "2026-06-10T10:00:00.000Z",
  ends_at: "2026-06-10T12:00:00.000Z",
  subtotal_minor: 600000,
  deposit_minor: 0,
  remainder_minor: 600000,
  currency: "RUB",
  cancellation_policy_snapshot: null,
  meeting_point: "Площадь Ленина",
  payment_method: "in_person",
  payment_status: "pending",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  guide_phone: "+79990000000",
  guide_contact_error: false,
  guide_profile: {
    user_id: "guide-1",
    bio: "",
    rating: 0,
    completed_tours: 0,
    is_available: true,
    regions: [],
    languages: [],
    specialties: [],
    specializations: [],
    specialization: null,
    attestation_status: "pending",
    verification_status: "approved",
    verification_notes: null,
    payout_account_label: null,
    years_experience: 0,
    slug: "guide-1",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    legal_status: null,
    inn: null,
    document_country: null,
    is_tour_operator: false,
    tour_operator_registry_number: null,
    average_rating: 0,
    response_rate: 0,
    review_count: 0,
    contact_visibility_unlocked: false,
    locale: "ru",
    preferred_currency: "RUB",
    notification_prefs: {},
    base_city: null,
    max_group_size: null,
    guide_type: null,
    profile: {
      full_name: "Анна",
      phone: "+79990000000",
      avatar_url: null,
    },
  },
  traveler_request: {
    destination: "Элиста",
    starts_on: "2026-06-10",
    ends_on: null,
    participants_count: 2,
    notes: "Прогулка по центру",
    interests: [],
    start_time: "10:00:00",
    end_time: null,
    format_preference: "group",
    open_to_join: true,
  },
  guide_offer: {
    price_minor: 600000,
    currency: "RUB",
    message: "Покажу город и главные места.",
    title: "Городская прогулка",
    inclusions: ["Чай"],
    capacity: 2,
    starts_at: "2026-06-10T10:00:00.000Z",
    ends_at: "2026-06-10T12:00:00.000Z",
  },
} satisfies BookingWithDetails;

describe("BookingDetailScreen", () => {
  it("renders traveler review, dispute, payment/contact blocks without guide controls", () => {
    const { container } = render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Свяжитесь с гидом напрямую")).toBeInTheDocument();
    expect(screen.getByText("Стоимость")).toBeInTheDocument();
    expect(screen.getByText(/Оцените поездку/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Открыть спор" })).toBeInTheDocument();
    expect(screen.queryByText("Операции по бронированию")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Подтвердить" })).not.toBeInTheDocument();

    // Desktop sticky-rail layout: container becomes a 2-col grid at lg; the
    // decision cluster (money + agreement + actions) lives in a sticky aside.
    expect(
      container.querySelector(
        '[class*="lg:grid-cols-[minmax(0,1fr)_360px]"]',
      ),
    ).not.toBeNull();
    expect(
      container.querySelector('aside[class*="lg:sticky"]'),
    ).not.toBeNull();
  });

  it("renders guide controls and revealed traveler contact on a confirmed booking", async () => {
    getGuideBookingDetailAction.mockResolvedValue({
      ok: true,
      booking: {
        id: "booking-1",
        title: "Площадь Ленина",
        destination: "Площадь Ленина",
        dateLabel: "10 июня 2026",
        priceRub: 6000,
        travelerName: "Мария",
        travelerPhone: "+79991234567",
        status: "confirmed",
      },
    });

    render(<BookingDetailScreen viewerRole="guide" bookingId="booking-1" />);

    expect(await screen.findByRole("button", { name: "Завершить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отменить" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Подтвердить" })).not.toBeInTheDocument();
    expect(screen.getByText("Свяжитесь с путешественником")).toBeInTheDocument();
    expect(screen.getByText("Мария")).toBeInTheDocument();
    const phoneLink = screen.getByRole("link", { name: "+79991234567" });
    expect(phoneLink).toHaveAttribute("href", "tel:+79991234567");
    expect(screen.queryByText(/Оцените поездку/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Открыть спор" })).not.toBeInTheDocument();
  });

  it("shows a loading state while the fetch is pending, not a not-found message", async () => {
    let resolveDetail: (value: unknown) => void = () => {};
    getGuideBookingDetailAction.mockReturnValue(
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
    );

    const { container } = render(
      <BookingDetailScreen viewerRole="guide" bookingId="booking-1" />,
    );

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("Бронирование не найдено")).not.toBeInTheDocument();

    resolveDetail({
      ok: true,
      booking: {
        id: "booking-1",
        title: "Площадь Ленина",
        destination: "Площадь Ленина",
        dateLabel: "10 июня 2026",
        priceRub: 6000,
        travelerName: "Мария",
        travelerPhone: "+79991234567",
        status: "confirmed",
      },
    });

    expect(await screen.findByRole("button", { name: "Завершить" })).toBeInTheDocument();
  });

  it("shows not-found only after the fetch resolves without a booking", async () => {
    getGuideBookingDetailAction.mockResolvedValue({ ok: true, booking: null });

    render(<BookingDetailScreen viewerRole="guide" bookingId="missing" />);

    expect(await screen.findByText("Бронирование не найдено")).toBeInTheDocument();
  });

  it("renders MoneyBreakdown deposit and remainder rows when both are present", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Итого")).toBeInTheDocument();
    expect(screen.getByText("Депозит")).toBeInTheDocument();
    expect(screen.getByText("Остаток")).toBeInTheDocument();
  });

  it("omits deposit and remainder rows when both are null, keeping Итого", () => {
    const bookingNoSplit = {
      ...booking,
      deposit_minor: null,
      remainder_minor: null,
    } as unknown as BookingWithDetails;

    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={bookingNoSplit}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Итого")).toBeInTheDocument();
    expect(screen.queryByText("Депозит")).not.toBeInTheDocument();
    expect(screen.queryByText("Остаток")).not.toBeInTheDocument();
  });

  it("reveals guide identity and contact via ContactReveal on a completed booking", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Проверен")).toBeInTheDocument();
    const phoneLink = screen.getByRole("link", { name: "+79990000000" });
    expect(phoneLink).toHaveAttribute("href", "tel:+79990000000");
  });

  it("shows the platform prepayment disclosure for travelers", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getAllByText(/Оплата напрямую гиду/).length).toBeGreaterThan(0);
  });

  it("does not render raw checkmark or contact glyphs in the traveler view", () => {
    const { container } = render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(container.textContent ?? "").not.toMatch(/[✓✉✈]/);
  });

  it("always renders the guide payout line, independent of NODE_ENV", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getGuideBookingDetailAction.mockResolvedValue({
      ok: true,
      booking: {
        id: "booking-1",
        title: "Элиста",
        destination: "Элиста",
        dateLabel: "10 июня 2026",
        priceRub: 6000,
        travelerName: "Мария",
        travelerPhone: "+79991234567",
        status: "confirmed",
      },
    });

    render(<BookingDetailScreen viewerRole="guide" bookingId="booking-1" />);

    expect(await screen.findByText(/Выплата:/)).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("renders the payment agreement card with a confirm button when the traveler has not confirmed", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        paymentAgreement={{
          id: "agreement-1",
          bookingId: "booking-1",
          agreedTotalMinor: 600000,
          currency: "RUB",
          method: "in_person",
          travelerConfirmedAt: null,
          guideConfirmedAt: null,
        }}
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Договорённость об оплате")).toBeInTheDocument();
    expect(screen.getByText("Оплата при встрече")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Подтвердить договорённость" }),
    ).toBeInTheDocument();
  });

  it("shows the confirmed state and hides the button once the traveler has confirmed", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        paymentAgreement={{
          id: "agreement-1",
          bookingId: "booking-1",
          agreedTotalMinor: 600000,
          currency: "RUB",
          method: "in_person",
          travelerConfirmedAt: "2026-06-23T10:00:00Z",
          guideConfirmedAt: null,
        }}
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.getByText("Договорённость об оплате")).toBeInTheDocument();
    expect(screen.getByText("подтвердил")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Подтвердить договорённость" }),
    ).not.toBeInTheDocument();
  });

  it("omits the payment agreement card when no agreement exists", () => {
    render(
      <BookingDetailScreen
        viewerRole="traveler"
        booking={booking}
        existingReview={null}
        listingTitle="Городская прогулка"
        paymentAgreement={null}
        openBookingThreadAction={async () => ({ threadId: "thread-1" })}
      />,
    );

    expect(screen.queryByText("Договорённость об оплате")).not.toBeInTheDocument();
  });

  it("renders BookingDetailSkeleton placeholder blocks", () => {
    const { container } = render(<BookingDetailSkeleton />);

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(3);
  });
});
