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

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

const DESTINATIONS = [
  { name: "Кавказ", region: "Юг", guideCount: 3 },
  { name: "Камчатка", region: "Дальний Восток", guideCount: 2 },
  { name: "Карелия", region: "Северо-Запад", guideCount: 1 },
  { name: "Сочи", region: "Юг", guideCount: 5 },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  mockCreateRequest.mockReset();
  mockCreateRequest.mockResolvedValue({ error: null });
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

    // The component suppresses jsx-a11y/role-has-required-aria-props on the grounds
    // that cmdk injects `aria-controls` at runtime (it points at cmdk's own generated
    // list id, which is not knowable in JSX). That justification is only acceptable if
    // it is TRUE — so assert the finished DOM really carries the attribute the linter
    // could not see. If a refactor drops `asChild`, this fails instead of silently
    // shipping a combobox that announces nothing to a screen reader.
    expect(input).toHaveAttribute("aria-controls");
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
    expect(screen.getByLabelText("Бюджет, ₽ на человека")).toHaveValue("5000");
  });
});
