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
});
