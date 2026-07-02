import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, notFound, redirect, flags } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  flags: {
    FEATURE_TR_FAVORITES: true,
  },
}));

vi.mock("next/navigation", () => ({
  notFound,
  redirect,
}));

vi.mock("@/features/favorites/components/FavoritesManager", () => ({
  FavoritesManager: () => <div>Favorites manager</div>,
}));

vi.mock("@/components/shared/cabinet-section-unavailable", () => ({
  CabinetSectionUnavailable: ({ title }: { title: string }) => (
    <div>Раздел скоро появится: {title}</div>
  ),
}));

vi.mock("@/lib/flags", () => ({
  flags,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import FavoritesPage from "./page";

describe("FavoritesPage", () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
    notFound.mockClear();
    redirect.mockClear();
    flags.FEATURE_TR_FAVORITES = true;
  });

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

  it("renders a useful empty state (not a cabinet 404) when the feature is disabled", async () => {
    flags.FEATURE_TR_FAVORITES = false;

    render(await FavoritesPage());

    expect(screen.getByText(/Раздел скоро появится/)).toBeInTheDocument();
    expect(screen.queryByText(/не найдена/i)).not.toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
