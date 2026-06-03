import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockFrom,
  mockProfilesUpdate,
  mockProfilesEq,
  mockGuideUpdate,
  mockGuideEq,
} = vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
    mockProfilesUpdate: vi.fn(),
    mockProfilesEq: vi.fn(),
    mockGuideUpdate: vi.fn(),
    mockGuideEq: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { updatePersonalSettings } from "./updatePersonalSettings";

describe("updatePersonalSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
    });
    mockProfilesEq.mockResolvedValue({ error: null, count: 1 });
    mockProfilesUpdate.mockReturnValue({ eq: mockProfilesEq });
    mockGuideEq.mockResolvedValue({ error: null, count: 1 });
    mockGuideUpdate.mockReturnValue({ eq: mockGuideEq });
  });

  it("persists traveler notification prefs on profiles", async () => {
    const profilesMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "traveler" },
    });
    const profilesSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: profilesMaybeSingle }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: profilesSelect,
          update: mockProfilesUpdate,
        };
      }
      return {
        select: vi.fn(),
        update: mockGuideUpdate,
      };
    });

    const prefs = { "traveler.new_offer.email": true };
    const result = await updatePersonalSettings({
      locale: "ru",
      preferredCurrency: "RUB",
      notificationPrefs: prefs,
    });

    expect(result).toEqual({ success: true });
    expect(mockProfilesUpdate).toHaveBeenCalledWith(
      { notification_prefs: prefs },
      { count: "exact" },
    );
    expect(mockGuideUpdate).not.toHaveBeenCalled();
  });

  it("does not report success when traveler locale or currency cannot be persisted", async () => {
    const profilesMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "traveler" },
    });
    const profilesSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: profilesMaybeSingle }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: profilesSelect,
          update: mockProfilesUpdate,
        };
      }
      return {
        select: vi.fn(),
        update: mockGuideUpdate,
      };
    });

    const result = await updatePersonalSettings({
      locale: "en",
      preferredCurrency: "USD",
      notificationPrefs: {},
    });

    expect(result).toEqual({
      success: false,
      error: "Настройки языка и валюты доступны только профилям гида.",
    });
    expect(mockProfilesUpdate).not.toHaveBeenCalled();
    expect(mockGuideUpdate).not.toHaveBeenCalled();
  });

  it("throws when traveler notification prefs update affects no rows", async () => {
    const profilesMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "traveler" },
    });
    const profilesSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: profilesMaybeSingle }),
    });
    mockProfilesEq.mockResolvedValue({ error: null, count: 0 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: profilesSelect,
          update: mockProfilesUpdate,
        };
      }
      return {
        select: vi.fn(),
        update: mockGuideUpdate,
      };
    });

    await expect(
      updatePersonalSettings({
        locale: "ru",
        preferredCurrency: "RUB",
        notificationPrefs: {},
      }),
    ).rejects.toThrow("Профиль не найден или не доступен.");
  });
});
