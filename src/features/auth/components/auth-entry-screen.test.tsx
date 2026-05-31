import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => false,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/features/auth/actions/signUpAction", () => ({
  signUpAction: vi.fn(),
}));

import { AuthEntryScreen } from "./auth-entry-screen";

describe("AuthEntryScreen unavailable auth fallback", () => {
  it("shows product copy without implementation config names", () => {
    render(<AuthEntryScreen />);

    expect(
      screen.getByText("Вход временно недоступен. Напишите в поддержку."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NEXT_PUBLIC_SUPABASE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\.env/i)).not.toBeInTheDocument();
  });
});
