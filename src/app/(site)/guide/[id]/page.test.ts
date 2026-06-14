import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClient,
  notFound,
  permanentRedirect,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
  permanentRedirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import LegacyGuideRedirectPage from "./page";

type GuideProfileSlugResponse = {
  data: { slug: string | null } | null;
  error: Error | null;
};

function supabaseWithGuideSlug(response: GuideProfileSlugResponse) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(response),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return {
    supabase: {
      from: vi.fn(() => query),
    },
    query,
  };
}

describe("LegacyGuideRedirectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permanently redirects a legacy guide id to the canonical guide slug", async () => {
    const { supabase, query } = supabaseWithGuideSlug({
      data: { slug: "amina-steppe" },
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue(supabase);

    await expect(
      LegacyGuideRedirectPage({ params: Promise.resolve({ id: "123" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/guides/amina-steppe");

    expect(supabase.from).toHaveBeenCalledWith("guide_profiles");
    expect(query.select).toHaveBeenCalledWith("slug");
    expect(query.eq).toHaveBeenCalledWith("user_id", "123");
    expect(permanentRedirect).toHaveBeenCalledWith("/guides/amina-steppe");
  });

  it("returns notFound when the legacy guide id has no slug", async () => {
    const { supabase } = supabaseWithGuideSlug({
      data: null,
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue(supabase);

    await expect(
      LegacyGuideRedirectPage({ params: Promise.resolve({ id: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
    expect(permanentRedirect).not.toHaveBeenCalled();
  });
});
