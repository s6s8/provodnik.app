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

  it("shows admin re-auth guidance when admin access is denied", () => {
    render(<AuthEntryScreen errorCode="admin-access-denied" next="/admin/dashboard" />);

    expect(
      screen.getByText(/Для входа в админку нужен аккаунт с ролью администратора/i),
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
      expect(assignMock).toHaveBeenCalledWith("/trips");
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

  it("shows an error instead of trusting user_metadata admin when the profile role read fails", async () => {
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

    render(<AuthEntryScreen role="traveler" next="/admin/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@provodnik.app" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Не удалось проверить права администратора после входа/i),
      ).toBeInTheDocument();
    });
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows an error instead of silently signing out when the role cannot be resolved", async () => {
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
      data: null,
      error: null,
    });

    render(<AuthEntryScreen role="traveler" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "broken@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Broken1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Не удалось определить роль аккаунта/i),
      ).toBeInTheDocument();
    });
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows an admin access error when signing into /admin without admin rights", async () => {
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

    render(<AuthEntryScreen role="traveler" next="/admin/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "traveler@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Travel1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(
        screen.getByText(/нет прав администратора/i),
      ).toBeInTheDocument();
    });
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows a database session error in Russian when sign-in fails at token issuance", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Database error querying schema" },
    });

    render(<AuthEntryScreen role="traveler" next="/admin/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@provodnik.test" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "Admin1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(
        screen.getByText(/ошибка выдачи сессии/i),
      ).toBeInTheDocument();
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
      expect(assignMock).toHaveBeenCalledWith("/trips");
    });
  });
});

describe("AuthEntryScreen guide sign-up landing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnvMock.mockReturnValue(true);
    assignMock.mockReset();
    vi.stubGlobal("location", { assign: assignMock, href: "" });
  });

  async function submitGuideSignUp() {
    fireEvent.change(screen.getByLabelText("ФИО полностью"), {
      target: { value: "Иван Петрович Гид" },
    });
    fireEvent.change(screen.getByLabelText("Как к вам обращаться"), {
      target: { value: "Иван" },
    });
    fireEvent.change(screen.getByLabelText("Телефон для проверки"), {
      target: { value: "+7 900 123-45-67" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "guide@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Создайте пароль"), {
      target: { value: "Guide1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Создать профиль" }));
  }

  it("asks a guide for the legal full name AND the public display name", async () => {
    render(<AuthEntryScreen role="guide" />);

    expect(screen.getByLabelText("ФИО полностью")).toBeInTheDocument();
    expect(screen.getByLabelText("Как к вам обращаться")).toBeInTheDocument();
    expect(screen.getByText(/только имя/i)).toBeInTheDocument();
  });

  it("sends both names to signUpAction so the public name is never the email", async () => {
    const { signUpAction } = await import("@/features/auth/actions/signUpAction");
    vi.mocked(signUpAction).mockResolvedValue({
      ok: true,
      dashboardPath: "/guide/profile",
    });

    render(<AuthEntryScreen role="guide" />);
    await submitGuideSignUp();

    await waitFor(() => {
      expect(signUpAction).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Иван Петрович Гид",
          displayName: "Иван",
        }),
      );
    });
  });

  it("blocks guide sign-up when the public display name is blank", async () => {
    const { signUpAction } = await import("@/features/auth/actions/signUpAction");

    render(<AuthEntryScreen role="guide" />);
    fireEvent.change(screen.getByLabelText("ФИО полностью"), {
      target: { value: "Иван Петрович Гид" },
    });
    fireEvent.change(screen.getByLabelText("Телефон для проверки"), {
      target: { value: "+7 900 123-45-67" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "guide@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Создайте пароль"), {
      target: { value: "Guide1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Создать профиль" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Укажите, как к вам обращаться/i),
      ).toBeInTheDocument();
    });
    expect(signUpAction).not.toHaveBeenCalled();
  });

  it("sends a new guide to the verification anketa, not the guide dashboard", async () => {
    const { signUpAction } = await import("@/features/auth/actions/signUpAction");
    vi.mocked(signUpAction).mockResolvedValue({
      ok: true,
      dashboardPath: "/guide/profile",
    });

    render(<AuthEntryScreen role="guide" />);
    await submitGuideSignUp();

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/guide/profile");
    });
  });

  it("still honors an explicit ?next= over the anketa landing", async () => {
    const { signUpAction } = await import("@/features/auth/actions/signUpAction");
    vi.mocked(signUpAction).mockResolvedValue({
      ok: true,
      dashboardPath: "/guide/profile",
    });

    render(<AuthEntryScreen role="guide" next="/guide/inbox" />);
    await submitGuideSignUp();

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/guide/inbox");
    });
  });

  it.each(["https://evil.com", "/admin", "/"])(
    "falls back to the anketa, not the guide dashboard, when ?next=%s is rejected",
    async (next) => {
      const { signUpAction } = await import("@/features/auth/actions/signUpAction");
      vi.mocked(signUpAction).mockResolvedValue({
        ok: true,
        dashboardPath: "/guide/profile",
      });

      render(<AuthEntryScreen role="guide" next={next} />);
      await submitGuideSignUp();

      await waitFor(() => {
        expect(assignMock).toHaveBeenCalledWith("/guide/profile");
      });
    },
  );
});
