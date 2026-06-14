import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  mockGetUser,
  mockUpdate,
  mockEq,
  hasSupabaseEnvMock,
  writeDemoTravelerProfileToCookiesMock,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  hasSupabaseEnvMock: vi.fn(),
  writeDemoTravelerProfileToCookiesMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/demo-traveler-profile", () => ({
  writeDemoTravelerProfileToCookies: writeDemoTravelerProfileToCookiesMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

import { updateTravelerProfile } from "./actions";

describe("updateTravelerProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });
  });

  it("persists traveler profile to demo cookie when Supabase env is missing", async () => {
    hasSupabaseEnvMock.mockReturnValue(false);
    const fd = new FormData();
    fd.set("name", "Анна");
    fd.set("bio", "Люблю горы");
    fd.set("homeCity", "Москва");
    fd.append("languages", "ru");
    fd.set("birthYear", "1990");

    const result = await updateTravelerProfile(fd);

    expect(result.ok).toBe(true);
    expect(writeDemoTravelerProfileToCookiesMock).toHaveBeenCalledWith({
      full_name: "Анна",
      bio: "Люблю горы",
      home_city: "Москва",
      languages: ["ru"],
      birth_year: 1990,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects bio with a phone number", async () => {
    const fd = new FormData();
    fd.set("bio", "Звоните 89001234567");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Контактные данные/);
    }
  });

  it("accepts a clean bio and saves all profile fields to db", async () => {
    const fd = new FormData();
    fd.set("name", "Алексей Иванов");
    fd.set("bio", "Люблю горы и море");
    fd.set("homeCity", "Казань");
    fd.append("languages", "ru");
    fd.append("languages", "en");
    fd.set("birthYear", "1988");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      full_name: "Алексей Иванов",
      bio: "Люблю горы и море",
      home_city: "Казань",
      languages: ["ru", "en"],
      birth_year: 1988,
    });
    expect(mockEq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
  });

  it("rejects empty name", async () => {
    const fd = new FormData();
    fd.set("name", "");
    fd.set("bio", "Люблю горы и море");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Укажите имя/);
    }
  });
});
