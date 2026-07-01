import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readAuthContextFromServerMock, redirectMock, createSupabaseServerClientMock } =
  vi.hoisted(() => ({
    readAuthContextFromServerMock: vi.fn(),
    redirectMock: vi.fn(),
    createSupabaseServerClientMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/app/(protected)/profile/_components/avatar-upload-block", () => ({
  AvatarUploadBlock: () => <div>Фото профиля</div>,
}));

vi.mock("@/features/profile/components/traveler-profile-form", () => ({
  TravelerProfileForm: () => <form aria-label="Профиль путешественника" />,
}));

vi.mock("@/lib/demo-traveler-profile", () => ({
  readDemoTravelerProfileFromCookies: vi.fn().mockResolvedValue(null),
}));

import PersonalSettingsPage from "./page";

describe("PersonalSettingsPage", () => {
  beforeEach(() => {
    readAuthContextFromServerMock.mockReset();
    redirectMock.mockReset();
    createSupabaseServerClientMock.mockReset();
  });

  it("redirects an authenticated admin to the admin dashboard", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: true,
      role: "admin",
      email: "qa-admin@example.com",
      source: "supabase",
    });

    await PersonalSettingsPage();

    expect(redirectMock).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("shows the login prompt for an unauthenticated visitor", async () => {
    readAuthContextFromServerMock.mockResolvedValueOnce({
      isAuthenticated: false,
      role: null,
      email: null,
      source: "none",
    });

    const ui = await PersonalSettingsPage();
    render(ui);

    expect(
      screen.getByRole("heading", { level: 1, name: "Войдите в аккаунт" }),
    ).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
