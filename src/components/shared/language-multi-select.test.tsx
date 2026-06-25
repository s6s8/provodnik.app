import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LANGUAGES } from "@/data/languages";
import { LanguageMultiSelect } from "./language-multi-select";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("LanguageMultiSelect", () => {
  it("shows the placeholder when no language is selected", () => {
    render(
      <LanguageMultiSelect options={LANGUAGES} value={[]} onChange={vi.fn()} />,
    );

    expect(screen.getByText("Любой язык")).toBeInTheDocument();
  });

  it("renders selected languages compactly with a +N overflow", () => {
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский", "Хинди"]}
        onChange={vi.fn()}
      />,
    );

    // Fixed single line: the first selection shows as a chip; the rest collapse into "+N".
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("toggles an option without dropping the prior selection", () => {
    const onChange = vi.fn();
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    fireEvent.click(screen.getByText("Английский"));

    expect(onChange).toHaveBeenCalledWith(["Русский", "Английский"]);
  });

  it("filters languages by case-insensitive substring search", () => {
    render(
      <LanguageMultiSelect options={LANGUAGES} value={[]} onChange={vi.fn()} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    fireEvent.change(screen.getByPlaceholderText("Поиск языка…"), {
      target: { value: "ар" },
    });

    expect(screen.getByText("Арабский")).toBeInTheDocument();
    expect(screen.queryByText("Русский")).not.toBeInTheDocument();
  });

  it("clears all selected languages", () => {
    const onChange = vi.fn();
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский", "Хинди"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Очистить" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("removes a selected language by unchecking it in the dropdown", () => {
    const onChange = vi.fn();
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский", "Хинди"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Выбрать языки экскурсии" }),
    );
    // "Хинди" is in the "+1" overflow (not a visible chip), so this targets the menu item.
    fireEvent.click(screen.getByText("Хинди"));

    expect(onChange).toHaveBeenCalledWith(["Русский"]);
  });

  it("opens the dropdown from a keyboard-operable trigger button", () => {
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский"]}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Выбрать языки экскурсии" });
    expect(trigger.tagName).toBe("BUTTON");
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText("Поиск языка…")).toBeInTheDocument();
  });
});
