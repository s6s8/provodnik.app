import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = vi.fn();
});

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
    vi.mocked(createRequestAction).mockClear();
    vi.mocked(createRequestAction).mockResolvedValue({ error: null });
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

  it("submits selected languages as requested_languages[]", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    fireEvent.click(screen.getByText("Английский"));
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));

    await waitFor(() => {
      expect(createRequestAction).toHaveBeenCalled();
    });

    const submittedFormData = vi.mocked(createRequestAction).mock.calls[0][1] as FormData;
    expect(submittedFormData.getAll("requested_languages[]")).toEqual([
      "Русский",
      "Английский",
    ]);
  });

  it("submits exact date flexibility by default and few days when toggled", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const { unmount } = render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));

    await waitFor(() => {
      expect(createRequestAction).toHaveBeenCalled();
    });

    const defaultFormData = vi.mocked(createRequestAction).mock.calls[0][1] as FormData;
    expect(defaultFormData.get("dateFlexibility")).toBe("exact");

    vi.mocked(createRequestAction).mockClear();
    unmount();
    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByTitle("Гибкая дата (±2–3 дня)"));
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));

    await waitFor(() => {
      expect(createRequestAction).toHaveBeenCalled();
    });

    const flexibleFormData = vi.mocked(createRequestAction).mock.calls[0][1] as FormData;
    expect(flexibleFormData.get("dateFlexibility")).toBe("few_days");
  });
});

describe("HomepageRequestForm UI affordances", () => {
  it("shows Russian controlled validation instead of English native messages", async () => {
    vi.mocked(createRequestAction).mockClear();
    render(<HomepageRequestForm destinations={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));

    expect(await screen.findByText("Укажите дату начала.")).toBeInTheDocument();
    expect(screen.getByText("Выберите хотя бы одну категорию")).toBeInTheDocument();
    expect(screen.queryByText(/Pick a start date/i)).not.toBeInTheDocument();
    expect(createRequestAction).not.toHaveBeenCalled();
  });

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
    expect(screen.getByText("Конец", { exact: false })).toBeInTheDocument();
  });

  it("renders the language multi-select inside «Добавить детали»", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const details = screen.getByText("Добавить детали").closest("details");
    expect(details).not.toBeNull();
    expect(within(details!).getByText("Языки экскурсии")).toBeInTheDocument();
    expect(within(details!).getByText("Русский")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Если важен конкретный язык — выберите. Иначе гиды любых языков смогут откликнуться.",
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );

    // canonical list — at minimum Russian + Hindi must be selectable
    expect(screen.getAllByText("Русский").length).toBeGreaterThan(0);
    expect(screen.getByText("Хинди")).toBeInTheDocument();
  });

  it("keeps the language multi-select working after moving it into details", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();

    fireEvent.click(screen.getByText("Добавить детали"));
    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    fireEvent.click(screen.getByText("Английский"));
    fireEvent.click(screen.getByRole("button", { name: /отправить запрос/i }));

    await waitFor(() => {
      expect(createRequestAction).toHaveBeenCalled();
    });

    const submittedFormData = vi.mocked(createRequestAction).mock.calls[0][1] as FormData;
    expect(submittedFormData.getAll("requested_languages[]")).toEqual([
      "Русский",
      "Английский",
    ]);
  });

  it("defaults start and end time inputs to common tour hours", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const startTime = document.getElementById("startTime") as HTMLInputElement;
    const endTime = document.getElementById("endTime") as HTMLInputElement;
    expect(startTime.value).toBe("10:00");
    expect(endTime.value).toBe("12:00");
  });

  it("renders compact form affordances without overlapping native controls", () => {
    render(<HomepageRequestForm destinations={[]} />);

    // ≈ toggle is in the label row (not inside the date input) — no pl-9, no absolute positioning
    const dateFlexibilityButton = screen.getByTitle("Гибкая дата (±2–3 дня)");
    expect(dateFlexibilityButton).toBeInTheDocument();

    const groupSizeInput = screen.getByLabelText("Сколько вас");
    expect(groupSizeInput).toHaveAttribute("placeholder", "2");
    expect(groupSizeInput).toHaveAttribute("type", "text");
  });

  it("topic chip exposes aria-pressed reflecting selection state (bug 3d58789e)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const historyChip = screen.getByRole("button", { name: /история/i });
    expect(historyChip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(historyChip);
    expect(historyChip).toHaveAttribute("aria-pressed", "true");
  });

  it("uses pointer cursor and filled active state on icon toggles", () => {
    render(<HomepageRequestForm destinations={[]} />);

    const dateFlexibilityButton = screen.getByTitle("Гибкая дата (±2–3 дня)");
    expect(dateFlexibilityButton).toHaveClass("cursor-pointer");
    expect(dateFlexibilityButton).toHaveClass("border-amber-400", "text-amber-500");
    fireEvent.click(dateFlexibilityButton);
    expect(dateFlexibilityButton).toHaveClass(
      "border-primary",
      "bg-primary",
      "text-primary-foreground",
    );

    const assemblyButton = screen.getByTitle(
      "Открытая группа — другие путешественники могут присоединиться",
    );
    expect(assemblyButton).toHaveClass("cursor-pointer");
    expect(assemblyButton).toHaveClass("border-amber-400", "text-amber-500");
    fireEvent.click(assemblyButton);
    expect(assemblyButton).toHaveClass(
      "border-primary",
      "bg-primary",
      "text-primary-foreground",
    );
  });

  it("renders topic chips as horizontal icon and label rows", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const historyChip = screen.getByRole("button", { name: /история и культура/i });
    expect(historyChip).toHaveClass(
      "flex-row",
      "items-center",
      "gap-2",
      "px-3",
      "py-2.5",
      "text-left",
    );
  });

  it("renders total-budget hint computed from budget × group size (bug 22f86d82)", () => {
    render(<HomepageRequestForm destinations={[]} />);
    // Default: groupSize=2, budgetPerPersonRub=5000 → 10 000 ₽
    const hint = document.getElementById("budgetPerPersonRub-total");
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toMatch(/Итого/);
    expect(hint!.textContent?.replace(/\s/g, "")).toMatch(/10000₽/);
  });

  it("uses genitive people wording after «из» in the total-budget hint", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const hint = document.getElementById("budgetPerPersonRub-total");
    expect(hint).not.toBeNull();
    expect(hint).toHaveTextContent(/за группу из 2 человек\./);

    fireEvent.change(screen.getByLabelText("Сколько вас"), {
      target: { value: "1" },
    });
    expect(hint).toHaveTextContent(/за группу из 1 человека\./);
  });

  it("renders group size and budget as two half-width fields; assembly icon present", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const groupSizeInput = screen.getByLabelText("Сколько вас");
    // input → div.grid.gap-2 → div.grid-cols-2
    const groupRow = groupSizeInput.closest("div")?.parentElement;
    expect(groupRow).toHaveClass("grid-cols-2");
    expect(within(groupRow!).getByLabelText("Бюджет на человека (₽)")).toBeInTheDocument();
    const assemblyButton = screen.getByTitle(
      "Открытая группа — другие путешественники могут присоединиться",
    );
    expect(assemblyButton.parentElement).toHaveClass("flex", "items-center", "gap-1.5");
    expect(within(assemblyButton.parentElement!).getByText("Сколько вас")).toBeInTheDocument();
    expect(screen.queryByLabelText("Открыт к увеличению группы")).toBeNull();
    expect(screen.queryByText(/попутчиков/i)).toBeNull();
    expect(screen.queryByText(/−10%/)).toBeNull();
    expect(screen.queryByText(/сдвиг группы/i)).toBeNull();
  });

  it("places date flexibility control next to the date label", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const dateFlexibilityButton = screen.getByTitle("Гибкая дата (±2–3 дня)");

    expect(dateFlexibilityButton.parentElement).toHaveClass("flex", "items-center", "gap-1.5");
    expect(within(dateFlexibilityButton.parentElement!).getByText("Дата")).toBeInTheDocument();
  });

  it("does not render «До скольких готов добрать» field", () => {
    render(<HomepageRequestForm destinations={[]} />);
    // Toggle assembly via icon button
    fireEvent.click(screen.getByTitle("Открытая группа — другие путешественники могут присоединиться"));
    expect(screen.queryByLabelText(/До скольких готов добрать/i)).toBeNull();
  });

  it("does not render the guide date-suggestion checkbox", () => {
    render(<HomepageRequestForm destinations={[]} />);
    expect(
      screen.queryByLabelText("Разрешаю гидам предлагать близкие даты и время"),
    ).toBeNull();
  });

  it("shows all topics without an expand button", () => {
    render(<HomepageRequestForm destinations={[]} />);

    expect(screen.getByRole("button", { name: /история и культура/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /религия и духовность/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ещё темы" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Свернуть" })).toBeNull();
  });

  it("renders topics in a three-column grid", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const historyChip = screen.getByRole("button", { name: /история и культура/i });
    expect(historyChip.parentElement).toHaveClass("grid-cols-3");
  });

  it("uses native time inputs with default values", () => {
    render(<HomepageRequestForm destinations={[]} />);

    const startTime = screen.getByLabelText("Начало");
    const endTime = screen.getByLabelText(/конец/i);

    expect(startTime).toHaveAttribute("type", "time");
    expect((startTime as HTMLInputElement).defaultValue).toBe("10:00");
    expect(endTime).toHaveAttribute("type", "time");
    expect((endTime as HTMLInputElement).defaultValue).toBe("12:00");
  });
});
