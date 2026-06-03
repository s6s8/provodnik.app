import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, requireAdminSession } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/components/shared/empty-state", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));
vi.mock("./actions", () => ({
  confirmPaymentAction: vi.fn(),
}));

import BookingsPage from "./page";

function createBookingsQuery(data: unknown[]) {
  const limit = vi.fn().mockResolvedValue({ data, error: null });
  const order = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ order }));

  return { select, order, limit };
}

describe("BookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies non-admin callers before listing bookings", async () => {
    const adminClient = {
      from: vi.fn(() => createBookingsQuery([])),
    };
    requireAdminSession.mockRejectedValue(new Error("Доступ только для администраторов."));

    await expect(BookingsPage()).rejects.toThrow("Доступ только для администраторов.");

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(adminClient.from).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires an admin session and reads bookings through the admin client", async () => {
    const bookingsQuery = createBookingsQuery([
      {
        id: "booking-1",
        status: "awaiting_guide_confirmation",
        subtotal_minor: 125000,
        currency: "RUB",
        starts_at: "2026-06-10T10:00:00.000Z",
        created_at: "2026-06-01T10:00:00.000Z",
        traveler_id: "traveler-123456789",
        guide_id: "guide-123456789",
      },
    ]);
    const adminClient = {
      from: vi.fn(() => bookingsQuery),
    };
    const serverClient = {
      from: vi.fn(() => createBookingsQuery([])),
    };
    requireAdminSession.mockResolvedValue({ adminClient });
    createSupabaseServerClient.mockResolvedValue(serverClient);

    const ui = await BookingsPage();
    render(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("bookings");
    expect(serverClient.from).not.toHaveBeenCalled();
    expect(screen.getByText("Ожидает подтверждения")).toBeInTheDocument();
    expect(screen.getByText("1 250 ₽")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подтвердить оплату" })).toBeInTheDocument();
  });
});
