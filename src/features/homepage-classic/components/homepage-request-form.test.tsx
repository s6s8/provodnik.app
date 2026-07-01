import { render, screen, fireEvent } from "@testing-library/react";
import { describe, beforeAll, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/features/requests/create-request-actions", () => ({
  createRequestAction: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/dates", () => ({
  todayMoscowISODate: () => "2026-01-01",
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("./homepage-auth-gate", () => ({
  HomepageAuthGate: ({ open }: { open: boolean }) =>
    open ? <div data-testid="auth-gate-open" /> : null,
}));

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("HomepageRequestFormClassic inset-label layout", () => {
  it("renders the icon-only brief fields with the mode toggle, themes & languages selects", () => {
    render(<HomepageRequestFormClassic destinations={[]} />);

    // Fields have no visible labels — addressed by their accessible (aria) labels.
    expect(screen.getByLabelText("Направление")).toBeInTheDocument();
    expect(screen.getByLabelText("Когда")).toBeInTheDocument();
    expect(screen.getByLabelText("Гостей")).toBeInTheDocument();
    expect(screen.getByLabelText("Бюджет на человека")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /сделать (закрытой|открытой)/i }),
    ).toBeInTheDocument();

    // Themes and languages are side-by-side multi-selects (no inline chips / «Ещё»).
    expect(screen.getByRole("button", { name: "Выбрать темы" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ещё" })).toBeNull();

    // «Детали» disclosure is collapsed by default; the notes field appears once opened.
    // The trigger and field are explicitly marked optional (MVP request model).
    expect(screen.queryByLabelText(/Пожелания/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Детали/ }));
    expect(screen.getByLabelText(/Пожелания/)).toBeInTheDocument();
  });

  it("uses the «Найти гида» submit with no sticky mobile bar", () => {
    render(<HomepageRequestFormClassic destinations={[]} />);
    const submit = screen.getByRole("button", { name: /найти гида/i });
    expect(submit.getAttribute("type")).toBe("submit");
    const form = submit.closest("form");
    expect(form).not.toHaveClass("pb-28");
    // Submit sits directly in the form flow, not inside a fixed sticky bar.
    expect(submit.parentElement).toBe(form);
  });
});
