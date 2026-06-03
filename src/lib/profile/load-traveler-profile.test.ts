import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadTravelerProfileFromSupabase } from "./load-traveler-profile";

function makeSupabaseMock(responses: {
  extended?: { data: unknown; error: unknown };
  basic?: { data: unknown; error: unknown };
}) {
  const maybeSingleExtended = vi.fn().mockResolvedValue(
    responses.extended ?? { data: null, error: { message: "column missing" } },
  );
  const maybeSingleBasic = vi.fn().mockResolvedValue(
    responses.basic ?? { data: null, error: null },
  );

  const from = vi.fn((table: string) => {
    if (table !== "profiles") throw new Error(`unexpected table ${table}`);
    return {
      select: vi.fn((columns: string) => ({
        eq: vi.fn(() => ({
          maybeSingle:
            columns.includes("bio") ? maybeSingleExtended : maybeSingleBasic,
        })),
      })),
    };
  });

  return { client: { from }, maybeSingleExtended, maybeSingleBasic };
}

describe("loadTravelerProfileFromSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns extended profile fields when the wide select succeeds", async () => {
    const { client } = makeSupabaseMock({
      extended: {
        data: {
          full_name: "Анна",
          avatar_url: null,
          bio: "Люблю горы",
          home_city: "Москва",
          languages: ["ru", "en"],
          birth_year: 1990,
        },
        error: null,
      },
    });

    const profile = await loadTravelerProfileFromSupabase(client as never, "user-1");

    expect(profile).toEqual({
      full_name: "Анна",
      avatar_url: null,
      bio: "Люблю горы",
      home_city: "Москва",
      languages: ["ru", "en"],
      birth_year: 1990,
    });
  });

  it("falls back to basic profile columns when extended columns are unavailable", async () => {
    const { client } = makeSupabaseMock({
      extended: { data: null, error: { message: "column does not exist" } },
      basic: {
        data: { full_name: "Алексей", avatar_url: "https://cdn/avatar.png" },
        error: null,
      },
    });

    const profile = await loadTravelerProfileFromSupabase(client as never, "user-1");

    expect(profile).toEqual({
      full_name: "Алексей",
      avatar_url: "https://cdn/avatar.png",
      bio: null,
      home_city: null,
      languages: null,
      birth_year: null,
    });
  });

  it("throws non-schema errors instead of hiding them as a missing profile", async () => {
    const dbError = { message: "permission denied for table profiles", code: "42501" };
    const { client, maybeSingleBasic } = makeSupabaseMock({
      extended: { data: null, error: dbError },
      basic: {
        data: { full_name: "Алексей", avatar_url: "https://cdn/avatar.png" },
        error: null,
      },
    });

    await expect(loadTravelerProfileFromSupabase(client as never, "user-1")).rejects.toBe(dbError);
    expect(maybeSingleBasic).not.toHaveBeenCalled();
  });

  it("keeps full_name null when the profile row has no stored name", async () => {
    const { client } = makeSupabaseMock({
      extended: {
        data: {
          full_name: null,
          avatar_url: null,
          bio: null,
          home_city: null,
          languages: null,
          birth_year: null,
        },
        error: null,
      },
    });

    const profile = await loadTravelerProfileFromSupabase(client as never, "user-1");

    expect(profile?.full_name).toBeNull();
  });
});
