import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, beforeEach, expect, it, vi } from "vitest";

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

vi.mock("@/app/(protected)/traveler/requests/new/actions", () => ({
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

import { HomepageRequestForm } from "./homepage-request-form";

function fillMinimalForm() {
  fireEvent.change(screen.getByLabelText(/куда хотите/i), {
    target: { value: "Москва" },
  });
  fireEvent.change(document.getElementById("startDate")!, {
    target: { value: "2026-06-01" },
  });
  // Select one interest to satisfy the min(1) schema requirement
  fireEvent.click(screen.getByRole("button", { name: /история/i }));
}

describe("HomepageRequestForm onSubmit", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("opens auth gate when getUser throws a network error", async () => {
    mockGetUser.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));
    await waitFor(() => {
      expect(screen.getByTestId("auth-gate-open")).toBeInTheDocument();
    });
  });

  it("opens auth gate when getUser returns null user (unauthenticated)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));
    await waitFor(() => {
      expect(screen.getByTestId("auth-gate-open")).toBeInTheDocument();
    });
  });
});

describe("HomepageRequestForm UI affordances", () => {
  it("defaults the destination input to «Москва» on first render", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const input = screen.getByLabelText(/куда хотите/i) as HTMLInputElement;
    expect(input.value).toBe("Москва");
  });

  it("does not render the umbrella «Когда» label above the date/time fields", () => {
    render(<HomepageRequestForm destinations={[]} />);
    expect(screen.queryByText("Когда")).not.toBeInTheDocument();
    expect(screen.getByText("Дата")).toBeInTheDocument();
    expect(screen.getByText("Начало")).toBeInTheDocument();
    expect(screen.getByText("Конец (необязательно)")).toBeInTheDocument();
  });

  it("renders the language multi-select labelled «Языки экскурсии» (bk-task-05)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    expect(screen.getByText(/Языки экскурсии/i)).toBeInTheDocument();
    // canonical list — at minimum Russian + Hindi must be selectable
    expect(screen.getByLabelText("Русский")).toBeInTheDocument();
    expect(screen.getByLabelText("Хинди")).toBeInTheDocument();
  });

  it("defaults start and end time inputs to 12:00 (bk-task-03)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const startTime = document.getElementById("startTime") as HTMLInputElement;
    const endTime = document.getElementById("endTime") as HTMLInputElement;
    expect(startTime.value).toBe("12:00");
    expect(endTime.value).toBe("12:00");
  });

  it("topic chip exposes aria-pressed reflecting selection state (bug 3d58789e)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const historyChip = screen.getByRole("button", { name: /история/i });
    expect(historyChip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(historyChip);
    expect(historyChip).toHaveAttribute("aria-pressed", "true");
  });

  it("renders total-budget hint computed from budget × group size (bug 22f86d82)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    // Default: groupSize=2, budgetPerPersonRub=5000 → 10 000 ₽
    const hint = document.getElementById("budgetPerPersonRub-total");
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toMatch(/Итого/);
    expect(hint!.textContent?.replace(/\s/g, "")).toMatch(/10000₽/);
  });

  it("renders the assembly checkbox with the new label and no explanation", () => {
    render(<HomepageRequestForm destinations={[]} />);
    expect(
      screen.getByLabelText("Открыт к увеличению группы"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/попутчиков/i)).toBeNull();
    expect(screen.queryByText(/−10%/)).toBeNull();
    expect(screen.queryByText(/сдвиг группы/i)).toBeNull();
  });

  it("does not render «До скольких готов добрать» field", () => {
    render(<HomepageRequestForm destinations={[]} />);
    // Toggle assembly checkbox on
    fireEvent.click(screen.getByLabelText("Открыт к увеличению группы"));
    expect(screen.queryByLabelText(/До скольких готов добрать/i)).toBeNull();
  });

  it("renders the flexibility checkbox, default unchecked", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const flex = screen.getByLabelText(
      "Разрешаю гидам предлагать близкие даты и время",
    );
    expect(flex).toBeInTheDocument();
    expect(flex).not.toBeChecked();
  });

  it("flexibility checkbox does not expand any extra field on toggle", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const flex = screen.getByLabelText(
      "Разрешаю гидам предлагать близкие даты и время",
    );
    const before = document.querySelectorAll("input,select").length;
    fireEvent.click(flex);
    const after = document.querySelectorAll("input,select").length;
    expect(after).toBe(before);
  });
});
