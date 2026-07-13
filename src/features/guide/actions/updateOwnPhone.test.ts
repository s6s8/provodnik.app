import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  phoneLookup: vi.fn(),
  profileUpdateEq: vi.fn(),
  profileUpdate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table: ${table}`);
      return { update: mocks.profileUpdate };
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) => ({
            maybeSingle: () => mocks.phoneLookup(column, value),
          })),
        })),
      };
    }),
  })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateOwnPhoneAction } from "./updateOwnPhone";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("updateOwnPhoneAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    mocks.phoneLookup.mockResolvedValue({ data: null, error: null });
    mocks.profileUpdateEq.mockResolvedValue({ error: null });
    mocks.profileUpdate.mockReturnValue({ eq: mocks.profileUpdateEq });
  });

  it("rejects a phone without digits", async () => {
    const result = await updateOwnPhoneAction("  --- ");

    expect(result.ok).toBe(false);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it("rejects a phone already taken by another profile", async () => {
    mocks.phoneLookup.mockResolvedValue({ data: { id: "other-user" }, error: null });

    const result = await updateOwnPhoneAction("+7 (900) 123-45-67");

    expect(result).toEqual({ ok: false, error: "Этот телефон уже используется" });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it("looks uniqueness up by the digits-only normalized phone (same rule as signUpAction)", async () => {
    await updateOwnPhoneAction("+7 (900) 123-45-67");

    expect(mocks.phoneLookup).toHaveBeenCalledWith("phone_normalized", "79001234567");
  });

  it("updates the caller's own profile phone", async () => {
    const result = await updateOwnPhoneAction("+7 (900) 123-45-67");

    expect(result).toEqual({ ok: true });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ phone: "+7 (900) 123-45-67" });
    expect(mocks.profileUpdateEq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("requires a signed-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await updateOwnPhoneAction("+7 900 123-45-67");

    expect(result.ok).toBe(false);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });
});
