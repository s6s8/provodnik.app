import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: mockEq })),
    })),
  })),
}));

import { updateTravelerProfile } from "./actions";

describe("updateTravelerProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mockEq.mockResolvedValue({ error: null });
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

  it("accepts a clean bio and saves to db", async () => {
    const fd = new FormData();
    fd.set("name", "Алексей Иванов");
    fd.set("bio", "Люблю горы и море");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(true);
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
