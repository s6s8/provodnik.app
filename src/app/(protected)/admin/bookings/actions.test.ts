import { beforeEach, describe, expect, it, vi } from "vitest";

const bunTestSpecifier = "bun:" + "test";
const bunMock = process.env.VITEST
  ? null
  : ((await import(bunTestSpecifier)) as typeof import("bun:test")).mock;

const createSupabaseServerClient = vi.fn();
const requireAdminSession = vi.fn();
const revalidatePath = vi.fn();

if (typeof vi.doMock === "function") {
  vi.doMock("server-only", () => ({}));
  vi.doMock("next/cache", () => ({
    revalidatePath,
  }));
  vi.doMock("@/lib/supabase/moderation", () => ({
    requireAdminSession,
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient,
  }));
}

bunMock?.module("server-only", () => ({}));
bunMock?.module("next/cache", () => ({
  revalidatePath,
}));
bunMock?.module("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));
bunMock?.module("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

function createUpdateQuery(
  response: {
    data: { id: string; status: string } | null;
    error: Error | null;
  } = {
    data: { id: "booking-1", status: "confirmed" },
    error: null,
  },
) {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const select = vi.fn(() => ({ maybeSingle }));
  const statusEq = vi.fn(() => ({ select }));
  const idEq = vi.fn(() => ({ eq: statusEq }));
  const update = vi.fn(() => ({ eq: idEq }));
  const from = vi.fn(() => ({ update }));

  return {
    client: { from },
    from,
    update,
    idEq,
    statusEq,
    select,
    maybeSingle,
  };
}

describe("confirmPaymentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an awaiting booking through the admin client and requires the updated row", async () => {
    const query = createUpdateQuery();
    const serverClient = {
      from: vi.fn(),
    };
    requireAdminSession.mockResolvedValue({ adminClient: query.client });
    createSupabaseServerClient.mockResolvedValue(serverClient);
    const { confirmPaymentAction } = await import("./actions");

    await confirmPaymentAction("booking-1");

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(query.from).toHaveBeenCalledWith("bookings");
    expect(query.update).toHaveBeenCalledWith({ status: "confirmed" });
    expect(query.idEq).toHaveBeenCalledWith("id", "booking-1");
    expect(query.statusEq).toHaveBeenCalledWith(
      "status",
      "awaiting_guide_confirmation",
    );
    expect(query.select).toHaveBeenCalledWith("id, status");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/bookings");
  });

  it("throws and does not revalidate when no booking row was updated", async () => {
    const query = createUpdateQuery({ data: null, error: null });
    requireAdminSession.mockResolvedValue({ adminClient: query.client });
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(),
    });
    const { confirmPaymentAction } = await import("./actions");

    await expect(confirmPaymentAction("booking-1")).rejects.toThrow(
      "Бронирование уже обработано или недоступно",
    );

    expect(query.select).toHaveBeenCalledWith("id, status");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
