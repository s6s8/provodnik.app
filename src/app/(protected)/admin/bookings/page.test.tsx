import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bunTestSpecifier = "bun:" + "test";
const bunMock = process.env.VITEST
  ? null
  : ((await import(bunTestSpecifier)) as typeof import("bun:test")).mock;

const createSupabaseServerClient = vi.fn();
const requireAdminSession = vi.fn();

if (typeof vi.doMock === "function") {
  vi.doMock("@/components/shared/empty-state", () => ({
    EmptyState: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => (
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    ),
  }));
  vi.doMock("server-only", () => ({}));
  vi.doMock("@/lib/supabase/moderation", () => ({
    requireAdminSession,
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient,
  }));
}

bunMock?.module("@/components/shared/empty-state", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));
bunMock?.module("server-only", () => ({}));
bunMock?.module("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));
bunMock?.module("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

function createBookingsQuery(data: unknown[]) {
  const limit = vi.fn().mockResolvedValue({ data, error: null });
  const order = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ order }));

  return { select, order, limit };
}

function createProfilesQuery(data: unknown[]) {
  const inFilter = vi.fn().mockResolvedValue({ data, error: null });
  const select = vi.fn(() => ({ in: inFilter }));

  return { select, in: inFilter };
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
    const { default: BookingsPage } = await import("./page");

    await expect(BookingsPage({})).rejects.toThrow("Доступ только для администраторов.");

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
    const profilesQuery = createProfilesQuery([
      { id: "traveler-123456789", full_name: "Иван Турист" },
      { id: "guide-123456789", full_name: "Пётр Гид" },
    ]);
    const adminClient = {
      from: vi.fn((table: string) =>
        table === "profiles" ? profilesQuery : bookingsQuery,
      ),
    };
    const serverClient = {
      from: vi.fn(() => createBookingsQuery([])),
    };
    requireAdminSession.mockResolvedValue({ adminClient });
    createSupabaseServerClient.mockResolvedValue(serverClient);
    const { default: BookingsPage } = await import("./page");

    const ui = await BookingsPage({});
    const html = renderToStaticMarkup(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("bookings");
    expect(adminClient.from).toHaveBeenCalledWith("profiles");
    expect(serverClient.from).not.toHaveBeenCalled();
    expect(html).toContain("Администрирование");
    expect(html).toContain("Бронирования");
    expect(html).toContain("#ooking-1");
    expect(html).toContain("Ожидает подтверждения");
    expect(html).toContain("1\u00a0250\u00a0₽");
    expect(html).toContain("Подтвердить");
    expect(html).not.toContain("Подтвердить оплату");
    expect(html).toContain("Иван Турист");
    expect(html).toContain("Пётр Гид");
  });
});
