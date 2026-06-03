import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, redirect } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect,
}));

vi.mock("@/features/favorites/components/FavoritesManager", () => ({
  FavoritesManager: () => <div>Favorites manager</div>,
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_FAVORITES: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import FavoritesPage from "./page";

describe("FavoritesPage", () => {
  it("preserves the favorites return path when redirecting unauthenticated users", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(FavoritesPage()).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=%2Ffavorites",
    );

    expect(redirect).toHaveBeenCalledWith("/auth?next=%2Ffavorites");
  });
});
