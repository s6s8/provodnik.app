import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { getPersonalSettings } from "./getPersonalSettings";

describe("getPersonalSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
    });
  });

  it("returns null when not authed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await getPersonalSettings();

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("loads traveler notification prefs from profiles", async () => {
    const prefs = { "traveler.new_offer.email": false };
    const roleMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "traveler" },
    });
    const prefsMaybeSingle = vi.fn().mockResolvedValue({
      data: { notification_prefs: prefs },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn((cols: string) => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle:
                cols === "role" ? roleMaybeSingle : prefsMaybeSingle,
            }),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await getPersonalSettings();

    expect(result).toEqual({
      notificationPrefs: prefs,
      locale: "ru",
      preferredCurrency: "RUB",
    });
  });

  it("defaults notificationPrefs to {} when the column is null", async () => {
    const roleMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "traveler" },
    });
    const prefsMaybeSingle = vi.fn().mockResolvedValue({
      data: { notification_prefs: null },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn((cols: string) => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle:
                cols === "role" ? roleMaybeSingle : prefsMaybeSingle,
            }),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await getPersonalSettings();

    expect(result?.notificationPrefs).toEqual({});
  });

  it("loads guide settings from guide_profiles", async () => {
    const prefs = { "guide.new_request.telegram": true };
    const roleMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "guide" },
    });
    const guideMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        notification_prefs: prefs,
        locale: "en",
        preferred_currency: "USD",
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: roleMaybeSingle }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: guideMaybeSingle }),
        }),
      };
    });

    const result = await getPersonalSettings();

    expect(result).toEqual({
      notificationPrefs: prefs,
      locale: "en",
      preferredCurrency: "USD",
    });
  });
});
