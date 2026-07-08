import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bunTestSpecifier = "bun:" + "test";
const bunMock = process.env.VITEST
  ? null
  : ((await import(bunTestSpecifier)) as typeof import("bun:test")).mock;

const requireAdminSession = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

if (typeof vi.doMock === "function") {
  vi.doMock("server-only", () => ({}));
  vi.doMock("@/lib/supabase/moderation", () => ({ requireAdminSession }));
  vi.doMock("next/navigation", () => ({ notFound }));
}

bunMock?.module("server-only", () => ({}));
bunMock?.module("@/lib/supabase/moderation", () => ({ requireAdminSession }));
bunMock?.module("next/navigation", () => ({ notFound }));

function createBookingQuery(row: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

function createProfilesQuery(data: unknown[]) {
  const inFilter = vi.fn().mockResolvedValue({ data, error: null });
  const select = vi.fn(() => ({ in: inFilter }));
  return { select, in: inFilter };
}

describe("AdminBookingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the booking detail with status, price and party names", async () => {
    const bookingQuery = createBookingQuery({
      id: "booking-abcdef12",
      status: "awaiting_guide_confirmation",
      subtotal_minor: 125000,
      currency: "RUB",
      starts_at: "2026-06-10T10:00:00.000Z",
      ends_at: null,
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-02T10:00:00.000Z",
      party_size: 3,
      meeting_point: "У фонтана",
      traveler_id: "traveler-123456789",
      guide_id: "guide-123456789",
    });
    const profilesQuery = createProfilesQuery([
      { id: "traveler-123456789", full_name: "Иван Турист" },
      { id: "guide-123456789", full_name: "Пётр Гид" },
    ]);
    const adminClient = {
      from: vi.fn((table: string) =>
        table === "profiles" ? profilesQuery : bookingQuery,
      ),
    };
    requireAdminSession.mockResolvedValue({ adminClient });
    const { default: AdminBookingDetailPage } = await import("./page");

    const ui = await AdminBookingDetailPage({
      params: Promise.resolve({ id: "booking-abcdef12" }),
    });
    const html = renderToStaticMarkup(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(adminClient.from).toHaveBeenCalledWith("bookings");
    expect(html).toContain("#abcdef12");
    expect(html).toContain("Ожидает подтверждения");
    expect(html).toContain("1 250 ₽");
    expect(html).toContain("Иван Турист");
    expect(html).toContain("Пётр Гид");
    expect(html).toContain("Подтвердить");
  });

  it("returns notFound for an unknown booking id", async () => {
    const bookingQuery = createBookingQuery(null);
    const adminClient = { from: vi.fn(() => bookingQuery) };
    requireAdminSession.mockResolvedValue({ adminClient });
    const { default: AdminBookingDetailPage } = await import("./page");

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
