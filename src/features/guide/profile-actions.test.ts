import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table !== "guide_profiles") {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      };
    }),
  })),
}));

import { revalidatePath } from "next/cache";

import { saveGuideAboutAction } from "./profile-actions";

function makeFormData(overrides?: Partial<Record<string, string | string[]>>) {
  const fd = new FormData();
  fd.set("bio", "Опытный гид");
  fd.set("base_city", "Санкт-Петербург");
  fd.set("years_experience", "5");
  fd.append("languages", "Русский");
  fd.append("specializations", "history_culture");
  const regions = overrides?.regions ?? ["Санкт Петербург", "Карелия"];
  for (const region of Array.isArray(regions) ? regions : [regions]) {
    fd.append("regions", region);
  }
  return fd;
}

describe("saveGuideAboutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "g-guide-1" } },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { verification_status: "draft" },
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: "g-guide-1" }, error: null }),
        })),
      })),
    });
  });

  it("persists regions that contain spaces", async () => {
    const result = await saveGuideAboutAction(makeFormData());

    expect(result).toEqual({
      ok: true,
      regions: ["Санкт Петербург", "Карелия"],
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        regions: ["Санкт Петербург", "Карелия"],
      }),
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/guide/profile");
  });

  it("inserts guide_profiles when the row is missing", async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    });
    mockInsert.mockReturnValue({
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: "g-guide-1" }, error: null }),
      })),
    });

    const result = await saveGuideAboutAction(makeFormData({ regions: ["Республика Карелия"] }));

    expect(result).toEqual({ ok: true, regions: ["Республика Карелия"] });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "g-guide-1",
        regions: ["Республика Карелия"],
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/guide/profile");
  });

  it("updates only bio for an approved guide profile", async () => {
    mockMaybeSingle.mockReset();
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        verification_status: "approved",
        regions: ["Карелия"],
      },
    });
    const eqAfterUpdate = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: eqAfterUpdate });

    const formData = makeFormData();
    formData.set("bio", "Новый публичный текст");
    formData.set("base_city", "Москва");

    const result = await saveGuideAboutAction(formData);

    expect(result).toEqual({ ok: true, regions: ["Карелия"] });
    expect(mockUpdate).toHaveBeenCalledWith({ bio: "Новый публичный текст" });
    expect(eqAfterUpdate).toHaveBeenCalledWith("user_id", "g-guide-1");
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/guide/profile");
  });
});
