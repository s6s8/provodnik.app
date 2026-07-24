import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseBrowserClientMock, getGuideBookingsMock } = vi.hoisted(() => ({
  createSupabaseBrowserClientMock: vi.fn(),
  getGuideBookingsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/data/supabase/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data/supabase/queries")>();
  return {
    ...actual,
    getGuideBookings: getGuideBookingsMock,
  };
});

import { GuideBookingsScreen } from "./guide-bookings-screen";

describe("GuideBookingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "guide-1" } },
          error: null,
        }),
      },
    });
  });

  it("shows a retry message when bookings fail to load", async () => {
    getGuideBookingsMock.mockRejectedValue(new Error("network failed"));

    render(<GuideBookingsScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Не удалось загрузить бронирования."),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Повторить загрузку" })).toBeInTheDocument();
    expect(screen.queryByText("Пока нет бронирований")).toBeNull();
  });

  it("sums only active and completed bookings in excursion total", async () => {
    getGuideBookingsMock.mockResolvedValue({
      data: [
        {
          id: "b-completed",
          title: "Экскурсия 1",
          destination: "Казань",
          dateLabel: "1 янв",
          priceRub: 10_000,
          status: "completed",
        },
        {
          id: "b-active",
          title: "Экскурсия 2",
          destination: "Самара",
          dateLabel: "2 янв",
          priceRub: 5_000,
          status: "confirmed",
        },
        {
          id: "b-cancelled",
          title: "Экскурсия 3",
          destination: "Уфа",
          dateLabel: "3 янв",
          priceRub: 20_000,
          status: "cancelled",
        },
        {
          id: "b-no-show",
          title: "Экскурсия 4",
          destination: "Пермь",
          dateLabel: "4 янв",
          priceRub: 30_000,
          status: "no_show",
        },
      ],
      error: null,
    });

    render(<GuideBookingsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Итоги по бронированиям")).toBeInTheDocument();
    });

    expect(screen.getByText(/15\s000\s*₽/)).toBeInTheDocument();
    expect(screen.getByText("Уфа")).toBeInTheDocument();
    expect(screen.getByText("Пермь")).toBeInTheDocument();

    const cancelledLabel = screen.getByText("Отменено");
    const cancelledValue = cancelledLabel.parentElement?.querySelectorAll("p")[1];
    expect(cancelledValue).toHaveTextContent("2");
  });
});
