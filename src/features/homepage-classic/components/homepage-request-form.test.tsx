import { render, screen, fireEvent, renderHook, act, waitFor } from "@testing-library/react";
import { describe, beforeAll, beforeEach, expect, it, vi } from "vitest";

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

import { createRequestAction } from "@/features/requests/create-request-actions";
import type { TravelerRequest } from "@/data/traveler-request/schema";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";
import { REQUEST_DRAFT_KEY, useRequestForm } from "./use-request-form";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("HomepageRequestFormClassic labelled layout", () => {
  it("renders the visibly labelled brief fields with the mode toggle, themes & languages selects", () => {
    render(<HomepageRequestFormClassic destinations={[]} />);

    // Every control carries a visible <Label> (or, for the date popover trigger,
    // an aria-label) — placeholders are examples, never the label.
    expect(screen.getByLabelText("Направление")).toBeInTheDocument();
    expect(screen.getByLabelText("Когда")).toBeInTheDocument();
    expect(screen.getByLabelText("Гостей")).toBeInTheDocument();
    expect(screen.getByLabelText("Бюджет, ₽ на человека")).toBeInTheDocument();
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
    expect(screen.queryByLabelText("Пожелания")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Детали" }));
    expect(screen.getByLabelText("Пожелания")).toBeInTheDocument();
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

  it("prefills location, notes, and budget from a selected ready excursion", () => {
    render(
      <HomepageRequestFormClassic
        destinations={[]}
        templatePrefill={{
          destination: "Казань",
          notes: "Прогулка по старому городу.",
          budgetPerPersonRub: 3000,
        }}
      />,
    );

    expect(screen.getByLabelText("Направление")).toHaveValue("Казань");
    fireEvent.click(screen.getByRole("button", { name: "Детали" }));
    expect(screen.getByLabelText("Пожелания")).toHaveValue("Прогулка по старому городу.");
    expect(screen.getByLabelText("Бюджет, ₽ на человека")).toHaveValue("3000");
  });
});

const draftValues: TravelerRequest = {
  mode: "assembly",
  interests: ["history_culture"],
  requestedLanguages: ["Русский"],
  destination: "Тбилиси",
  startDate: "2026-05-15",
  dateFlexibility: "exact",
  startTime: "10:00",
  endTime: "12:00",
  groupSize: 3,
  groupSizeCurrent: 3,
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 7000,
  notes: "",
};

describe("useRequestForm anonymous draft", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(createRequestAction).mockResolvedValue({ error: null });
  });

  it("persists the entered values to sessionStorage when the server demands auth", async () => {
    vi.mocked(createRequestAction).mockResolvedValueOnce({
      error: "Необходимо войти в систему для создания запроса.",
      code: "auth_required",
    });

    const { result } = renderHook(() => useRequestForm());
    await act(async () => {
      await result.current.submit(draftValues);
    });

    expect(result.current.authGateOpen).toBe(true);
    expect(JSON.parse(window.sessionStorage.getItem(REQUEST_DRAFT_KEY) ?? "null")).toMatchObject({
      destination: "Тбилиси",
      startDate: "2026-05-15",
      groupSize: 3,
      budgetPerPersonRub: 7000,
    });
  });

  it("restores a stored draft into the form on mount", async () => {
    window.sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draftValues));

    const { result } = renderHook(() => useRequestForm());

    await waitFor(() => {
      expect(result.current.form.getValues().destination).toBe("Тбилиси");
    });
    const values = result.current.form.getValues();
    expect(values.startDate).toBe("2026-05-15");
    expect(values.groupSize).toBe(3);
    expect(values.budgetPerPersonRub).toBe(7000);
    expect(values.interests).toEqual(["history_culture"]);
  });

  it("clears the draft after a successful submit", async () => {
    window.sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draftValues));

    const { result } = renderHook(() => useRequestForm());
    await act(async () => {
      await result.current.submit(draftValues);
    });

    expect(window.sessionStorage.getItem(REQUEST_DRAFT_KEY)).toBeNull();
  });

  it("does not throw when sessionStorage is unavailable", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError: storage is disabled");
      },
    });

    try {
      vi.mocked(createRequestAction).mockResolvedValueOnce({
        error: "Необходимо войти в систему для создания запроса.",
        code: "auth_required",
      });

      const { result } = renderHook(() => useRequestForm());
      await act(async () => {
        await result.current.submit(draftValues);
      });

      expect(result.current.authGateOpen).toBe(true);
    } finally {
      if (original) {
        Object.defineProperty(window, "sessionStorage", original);
      } else {
        Reflect.deleteProperty(window, "sessionStorage");
      }
    }
  });
});
