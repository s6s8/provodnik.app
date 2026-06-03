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

  it("renders selected languages as chips", () => {
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский", "Хинди"]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Русский")).toBeInTheDocument();
    expect(screen.getByText("Хинди")).toBeInTheDocument();
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

  it("removes a chip without opening the dropdown", () => {
    const onChange = vi.fn();
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Убрать Русский"));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.queryByPlaceholderText("Поиск языка…")).not.toBeInTheDocument();
  });

  it("exposes selected language removal as a keyboard-operable button", () => {
    const onChange = vi.fn();
    render(
      <LanguageMultiSelect
        options={LANGUAGES}
        value={["Русский"]}
        onChange={onChange}
      />,
    );

    const removeButton = screen.getByRole("button", { name: "Убрать Русский" });
    removeButton.focus();
    fireEvent.click(removeButton);

    expect(removeButton.tagName).toBe("BUTTON");
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
