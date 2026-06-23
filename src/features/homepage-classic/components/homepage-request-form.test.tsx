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

import { HomepageRequestForm } from "./homepage-request-form";
import { HomepageRequestFormClassic } from "./homepage-request-form-classic";
import { createRequestAction } from "@/features/requests/create-request-actions";

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

function getDateFlexibilityButton() {
  return screen.getByRole("button", { name: "≈" });
}

function getAssemblyButton() {
  return screen.getByRole("button", {
    name: /сделать (закрытой|открытой)/i,
  });
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
    fireEvent.click(getDateFlexibilityButton());
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
    const dateFlexibilityButton = getDateFlexibilityButton();
    expect(dateFlexibilityButton).toBeInTheDocument();
    expect(dateFlexibilityButton).not.toHaveAttribute("title");

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

    const dateFlexibilityButton = getDateFlexibilityButton();
    expect(dateFlexibilityButton).toHaveClass("cursor-pointer");
    expect(dateFlexibilityButton).toHaveClass("border-rose-200", "text-rose-700");
    fireEvent.click(dateFlexibilityButton);
    expect(dateFlexibilityButton).toHaveClass(
      "border-emerald-200",
      "bg-emerald-100",
      "text-emerald-700",
    );

    const assemblyButton = getAssemblyButton();
    expect(assemblyButton).toHaveClass("cursor-pointer");
    expect(assemblyButton).not.toHaveAttribute("title");
    // Default open (assembly): the lock control offers to make the group closed
    expect(assemblyButton).toHaveAttribute(
      "aria-label",
      "Открытая группа — нажмите, чтобы сделать закрытой",
    );
    fireEvent.click(assemblyButton);
    expect(
      screen.getByRole("button", {
        name: "Закрытая группа — нажмите, чтобы сделать открытой",
      }),
    ).toBeInTheDocument();
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

  it("renders group size as a single full-width field with an inline lock toggle; budget in a separate full-width row", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const groupSizeInput = screen.getByLabelText("Сколько вас");
    // input → relative flex wrapper that also holds the inline lock toggle
    const wrapper = groupSizeInput.closest("div");
    expect(wrapper).toHaveClass("relative", "flex", "items-center");
    expect(
      within(wrapper!).getByRole("button", { name: /сделать (закрытой|открытой)/i }),
    ).toBeInTheDocument();
    // The old separate «Сборная группа» toggle is gone
    expect(screen.queryByText("Сборная группа")).toBeNull();
    // Budget is its own full-width field, outside the group field
    expect(within(wrapper!).queryByLabelText("Бюджет на человека (₽)")).toBeNull();
    expect(screen.getByLabelText("Бюджет на человека (₽)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Открыт к увеличению группы")).toBeNull();
    expect(screen.queryByText(/попутчиков/i)).toBeNull();
    expect(screen.queryByText(/−10%/)).toBeNull();
    expect(screen.queryByText(/сдвиг группы/i)).toBeNull();
  });

  it("places date flexibility control next to the date label", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const dateFlexibilityButton = getDateFlexibilityButton();

    expect(dateFlexibilityButton.parentElement).toHaveClass("flex", "items-center", "gap-1.5");
    expect(within(dateFlexibilityButton.parentElement!).getByText("Дата")).toBeInTheDocument();
  });

  it("does not render «До скольких готов добрать» field", () => {
    render(<HomepageRequestForm destinations={[]} />);
    // Toggle assembly via icon button
    fireEvent.click(getAssemblyButton());
    expect(screen.queryByLabelText(/До скольких готов добрать/i)).toBeNull();
  });

  it("does not render the guide date-suggestion checkbox", () => {
    render(<HomepageRequestForm destinations={[]} />);
    expect(
      screen.queryByLabelText("Разрешаю гидам предлагать близкие даты и время"),
    ).toBeNull();
  });

  it("shows only first 3 topics with an expand button", () => {
    render(<HomepageRequestForm destinations={[]} />);

    expect(screen.getByRole("button", { name: /история и культура/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /природа/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /гастрономия/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /религия и духовность/i })).toBeNull();
    expect(screen.getByRole("button", { name: /ещё темы/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Свернуть" })).toBeNull();
  });

  it("expands all topics on 'Ещё темы' click", () => {
    render(<HomepageRequestForm destinations={[]} />);

    const expandBtn = screen.getByRole("button", { name: /ещё темы/i });
    fireEvent.click(expandBtn);

    expect(screen.getByRole("button", { name: /религия и духовность/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ещё темы/i })).toBeNull();
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

  it("renders an opaque mobile sticky CTA bar with bottom clearance so fields never show through", () => {
    render(<HomepageRequestForm destinations={[]} />);
    const submit = screen.getByRole("button", { name: /отправить запрос/i });
    const bar = submit.parentElement!;
    // Solid surface on mobile — never translucent over budget/themes fields
    expect(bar).toHaveClass("bg-background");
    expect(bar).not.toHaveClass("bg-background/95");
    // Form reserves bottom clearance on mobile so the last fields scroll clear of the bar
    const form = submit.closest("form");
    expect(form).toHaveClass("pb-28", "sm:pb-0");
  });
});

describe("HomepageRequestFormClassic repaired layout", () => {
  it("keeps the approved group, budget, details, and topic expansion layout", () => {
    render(<HomepageRequestFormClassic destinations={[]} />);

    const groupSizeInput = screen.getByLabelText("Сколько вас");
    const wrapper = groupSizeInput.closest("div");
    expect(wrapper).toHaveClass("relative", "flex", "items-center");
    expect(
      within(wrapper!).getByRole("button", { name: /сделать (закрытой|открытой)/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Сборная группа")).toBeNull();

    expect(within(wrapper!).queryByLabelText("Бюджет на человека (₽)")).toBeNull();
    expect(screen.getByLabelText("Бюджет на человека (₽)")).toBeInTheDocument();

    const details = screen.getByText("Добавить детали").closest("details");
    expect(details).not.toBeNull();
    expect(within(details!).getByText("Языки экскурсии")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /история и культура/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /природа/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /гастрономия/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /религия и духовность/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ещё темы →" }));

    expect(screen.getByRole("button", { name: /религия и духовность/i })).toBeInTheDocument();
  });

  it("renders an opaque mobile sticky CTA bar with bottom clearance", () => {
    render(<HomepageRequestFormClassic destinations={[]} />);
    const submit = screen.getByRole("button", { name: /отправить запрос/i });
    const bar = submit.parentElement!;
    expect(bar).toHaveClass("bg-background");
    expect(bar).not.toHaveClass("bg-background/95");
    const form = submit.closest("form");
    expect(form).toHaveClass("pb-28", "sm:pb-0");
  });
});
