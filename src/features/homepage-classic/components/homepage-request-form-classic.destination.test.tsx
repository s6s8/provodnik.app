import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, beforeAll, beforeEach, expect, it, vi } from "vitest";

const mockCreateRequest = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { getUser: vi.fn() } }),
}));

vi.mock("@/features/requests/create-request-actions", () => ({
  createRequestAction: (...args: unknown[]) => mockCreateRequest(...args),
}));

// Far in the past so the calendar's current month is never disabled by `min`,
// whatever the clock of the machine running the suite says.
vi.mock("@/lib/dates", () => ({ todayMoscowISODate: () => "2020-01-01" }));

vi.mock("@/lib/env", () => ({ hasSupabaseEnv: () => true }));

vi.mock("./homepage-auth-gate", () => ({ HomepageAuthGate: () => null }));

vi.mock("../actions/destination-suggestions-action", () => ({
  fetchDestinationSuggestionsAction: vi.fn(),
}));

import { fetchDestinationSuggestionsAction } from "../actions/destination-suggestions-action";
import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

const fetchDestinationSuggestionsActionMock = vi.mocked(fetchDestinationSuggestionsAction);

const DESTINATIONS = [
  { name: "Кавказ", region: "Юг", guideCount: 3 },
  { name: "Камчатка", region: "Дальний Восток", guideCount: 2 },
  { name: "Карелия", region: "Северо-Запад", guideCount: 1 },
  { name: "Сочи", region: "Юг", guideCount: 5 },
  { name: "Элиста", region: "Калмыкия", guideCount: 2 },
];

const DEFERRED_DESTINATIONS = [
  { name: "Элиста", region: "Калмыкия", guideCount: 2 },
  { name: "Эхо", region: "Центр", guideCount: 1 },
  { name: "Эльбрус", region: "Кавказ", guideCount: 3 },
  { name: "Элион", region: "Север", guideCount: 1 },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  mockCreateRequest.mockReset();
  mockCreateRequest.mockResolvedValue({ error: null });
  fetchDestinationSuggestionsActionMock.mockReset();
  fetchDestinationSuggestionsActionMock.mockResolvedValue({ ok: true, data: [] });
});

// WB C3: the destination field is an assistive combobox (cmdk), not a <datalist>.
// It suggests known destinations but never blocks free text (D-C3a).
describe("HomepageRequestFormClassic destination typeahead", () => {
  it("is labelled and exposes the combobox role", () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);

    const input = screen.getByLabelText("Направление");
    expect(input).toHaveAttribute("role", "combobox");
    // Nothing is suggested until the traveller types.
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input).toHaveAttribute("aria-expanded", "false");

    expect(input).toHaveAttribute("aria-controls", "destination-suggestions");
  });

  it("loads the full suggestion vocabulary on first focus", async () => {
    const expanded = [
      ...DESTINATIONS.slice(0, 2),
      { name: "Каспийск", region: "Дагестан", guideCount: 1 },
    ];
    fetchDestinationSuggestionsActionMock.mockResolvedValue({ ok: true, data: expanded });

    render(<HomepageRequestFormClassic destinations={DESTINATIONS.slice(0, 2)} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Кас" } });

    await waitFor(() => expect(fetchDestinationSuggestionsActionMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /Каспийск/ })).toBeInTheDocument(),
    );
  });

  it("filters the suggestions while typing «Кав» and closes on Escape", () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.change(input, { target: { value: "Кав" } });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Кавказ" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "Камчатка" })).toBeNull();
    expect(within(listbox).queryByRole("option", { name: "Сочи" })).toBeNull();
    expect(input).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("moves the highlight with the arrow keys and picks it with Enter", () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.change(input, { target: { value: "Ка" } });
    expect(screen.getAllByRole("option")).toHaveLength(3);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const first = screen.getByRole("option", { selected: true }).textContent;
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const second = screen.getByRole("option", { selected: true }).textContent;

    // The highlight actually moved — arrow keys traverse the list.
    expect(first).toBeTruthy();
    expect(second).not.toBe(first);

    fireEvent.keyDown(input, { key: "Enter" });

    // Enter commits the highlighted suggestion and closes the list.
    expect(input).toHaveValue(second);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects a suggestion on click", () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.change(input, { target: { value: "Кав" } });
    fireEvent.click(screen.getByRole("option", { name: "Кавказ" }));

    expect(input).toHaveValue("Кавказ");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("still submits free text that matches no suggestion (D-C3a)", async () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);

    const input = screen.getByLabelText("Направление");
    fireEvent.change(input, { target: { value: "Марс-Сити" } });
    // No destination matches — the field must not trap the traveller.
    expect(screen.queryByRole("listbox")).toBeNull();

    // Date (required): open the «Когда» popover and pick a day of the shown month.
    fireEvent.click(screen.getByRole("button", { name: "Когда" }));
    const day = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "20" && !b.hasAttribute("disabled"));
    expect(day).toBeDefined();
    fireEvent.click(day!);

    // Interest (required): pick the first theme from the multi-select.
    fireEvent.click(screen.getByRole("button", { name: "Выбрать темы" }));
    fireEvent.click(screen.getAllByRole("option")[0]);

    fireEvent.click(screen.getByRole("button", { name: /найти гида/i }));

    await waitFor(() => expect(mockCreateRequest).toHaveBeenCalled());
    const formData = mockCreateRequest.mock.calls[0][1] as FormData;
    expect(formData.get("destination")).toBe("Марс-Сити");
  });
});

// The fixture above is 4 destinations, so nothing here tested scale. The real
// vocabulary is every published listing's city+region plus every approved guide's
// base city and regions — it grows with the roster, and the field rendered ALL of
// it: no cap on the query, no cap on the rendered list. That is the reported freeze.
describe("HomepageRequestFormClassic destination typeahead at scale", () => {
  // Every entry matches "Ка", so nothing here is filtered out by the query.
  const MANY = Array.from({ length: 2000 }, (_, i) => ({
    name: `Кариж-${String(i).padStart(4, "0")}`,
    region: `Регион-${i % 7}`,
    guideCount: i % 5,
  }));

  it("caps the rendered suggestion list instead of mounting the whole vocabulary", () => {
    render(<HomepageRequestFormClassic destinations={MANY} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.change(input, { target: { value: "Ка" } });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(8);
  });

  it("keeps the value and focus through sequential typing, then selects", () => {
    render(<HomepageRequestFormClassic destinations={MANY} />);
    const input = screen.getByLabelText("Направление") as HTMLInputElement;
    input.focus();

    // Type the way a person does: one character at a time, no second click.
    for (const value of ["К", "Ка", "Кар", "Кари", "Кариж", "Кариж-0007"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
      expect(document.activeElement).toBe(input);
    }

    expect(screen.getAllByRole("option").length).toBeLessThanOrEqual(8);
    fireEvent.click(screen.getByRole("option", { name: /Кариж-0007/ }));

    expect(input).toHaveValue("Кариж-0007");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("does not focus out while deferred matches update for «Элиста»", async () => {
    render(<HomepageRequestFormClassic destinations={DEFERRED_DESTINATIONS} />);
    const input = screen.getByLabelText("Направление") as HTMLInputElement;
    const focusout = vi.fn();
    input.addEventListener("focusout", focusout);
    input.focus();

    for (const [value, count] of [
      ["Э", 4],
      ["Эл", 3],
      ["Эли", 2],
      ["Элиста", 1],
    ] as const) {
      fireEvent.input(input, { target: { value } });
      // The decreasing count proves the deferred filtering commit completed.
      await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(count));
      expect(screen.getByRole("option", { name: "Элиста" })).toBeInTheDocument();
      expect(input).toHaveValue(value);
      expect(document.activeElement).toBe(input);
      expect(focusout).not.toHaveBeenCalled();
    }
  });

  it("still accepts free text that matches nothing in a large vocabulary", () => {
    render(<HomepageRequestFormClassic destinations={MANY} />);
    const input = screen.getByLabelText("Направление");

    fireEvent.change(input, { target: { value: "Марс-Сити" } });

    expect(input).toHaveValue("Марс-Сити");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

// WB item 10: the anonymous draft must come back into the RENDERED FIELDS, not just
// into react-hook-form's state. The hook-level test (homepage-request-form.test.tsx)
// asserted `form.getValues()` and passed happily while the bug was live: `reset()` in
// an effect updated the state but never wrote back to the registered uncontrolled
// inputs. The visitor saw «2 гостей / 5 000 ₽» — the defaults — while the request that
// actually got submitted carried 4 and 7 000. Shown one trip, sent another.
// Anything that asserts state instead of the input cannot catch that; this does.
describe("HomepageRequestFormClassic draft restore", () => {
  const DRAFT = {
    mode: "assembly",
    interests: ["history_culture"],
    requestedLanguages: ["Русский"],
    destination: "Элиста",
    startDate: "2026-08-02",
    dateFlexibility: "exact",
    startTime: "10:00",
    endTime: "12:00",
    groupSize: 4,
    groupSizeCurrent: 1,
    allowGuideSuggestionsOutsideConstraints: true,
    budgetPerPersonRub: 7000,
    notes: "",
  };

  beforeEach(() => window.sessionStorage.clear());

  it("puts the stored draft back into the visible inputs", async () => {
    window.sessionStorage.setItem("provodnik:request-draft", JSON.stringify(DRAFT));

    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);

    await waitFor(() =>
      expect(screen.getByLabelText("Направление")).toHaveValue("Элиста"),
    );
    expect(screen.getByLabelText("Гостей")).toHaveValue("4");
    expect(screen.getByLabelText("Бюджет, ₽ на человека")).toHaveValue("7000");
  });

  it("renders the defaults when there is no draft", async () => {
    render(<HomepageRequestFormClassic destinations={DESTINATIONS} />);

    await waitFor(() => expect(screen.getByLabelText("Гостей")).toHaveValue("2"));
    expect(screen.getByLabelText("Направление")).toHaveValue("");
    expect(screen.getByLabelText("Бюджет, ₽ на человека")).toHaveValue("1000");
  });
});
