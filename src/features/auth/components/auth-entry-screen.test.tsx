import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPasswordMock, getSessionMock, maybeSingleMock, hasSupabaseEnvMock } =
  vi.hoisted(() => ({
    signInWithPasswordMock: vi.fn(),
    getSessionMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    hasSupabaseEnvMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: hasSupabaseEnvMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      getSession: getSessionMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: maybeSingleMock,
        })),
      })),
    })),
  })),
}));

vi.mock("@/features/auth/actions/signUpAction", () => ({
  signUpAction: vi.fn(),
}));

import { AuthEntryScreen } from "./auth-entry-screen";

const assignMock = vi.fn();

describe("AuthEntryScreen missing-role recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
  });

  it("shows recovery copy when the account has no role", () => {
    render(<AuthEntryScreen errorCode="missing-role" />);

    expect(
      screen.getByText(/Не удалось определить роль аккаунта/i),
    ).toBeInTheDocument();
  });
});

describe("AuthEntryScreen unavailable auth fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(false);
    assignMock.mockReset();
    assignMock.mockReset();
    vi.stubGlobal("location", { assign: assignMock, href: "" });
  });

  it("shows product copy without implementation config names", () => {
    render(<AuthEntryScreen />);

    expect(
      screen.getByText("Вход временно недоступен. Напишите в поддержку."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NEXT_PUBLIC_SUPABASE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\.env/i)).not.toBeInTheDocument();
  });
});

describe("AuthEntryScreen traveler sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
    getSessionMock.mockResolvedValue({ data: { session: {} }, error: null });
    assignMock.mockReset();
    vi.stubGlobal("location", { assign: assignMock, href: "" });
  });

  it("redirects travelers using profiles.role when JWT app_metadata is missing", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          app_metadata: {},
          user_metadata: {},
        },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { role: "traveler" },
      error: null,
    });

    render(<AuthEntryScreen role="traveler" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "traveler@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Travel1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/traveler/requests");
    });
    expect(getSessionMock).toHaveBeenCalled();
  });

  it("redirects travelers to ?next=/messages thread after sign-in", async () => {
    const threadId = "22222222-2222-4222-8222-222222222222";
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          app_metadata: { role: "traveler" },
          user_metadata: {},
        },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { role: "traveler" },
      error: null,
    });

    render(<AuthEntryScreen role="traveler" next={`/messages/${threadId}`} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "traveler@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Travel1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith(`/messages/${threadId}`);
    });
  });

  it("redirects admins to the admin dashboard when profiles.role is admin", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "10000000-0000-4000-8000-000000000001",
          app_metadata: { role: "guide" },
          user_metadata: { role: "guide" },
        },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    render(<AuthEntryScreen role="traveler" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@provodnik.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Admin1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("redirects admins using JWT metadata when the profile role read fails", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          app_metadata: {},
          user_metadata: { role: "admin" },
        },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "temporary read failure" },
    });

    render(<AuthEntryScreen role="traveler" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@provodnik.app" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("falls back to JWT metadata when the profile role read fails", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          app_metadata: { role: "traveler" },
          user_metadata: {},
        },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "temporary read failure" },
    });

    render(<AuthEntryScreen role="traveler" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "traveler@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Travel1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/traveler/requests");
    });
  });
});
