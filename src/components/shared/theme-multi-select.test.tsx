import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { THEMES } from "@/data/themes";

import { ThemeMultiSelect } from "./theme-multi-select";

const ALL_THEME_SLUGS = THEMES.map((theme) => theme.slug);

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ThemeMultiSelect", () => {
  it("selects every canonical theme with one action", () => {
    const onChange = vi.fn();
    render(<ThemeMultiSelect value={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Выбрать темы" }));
    fireEvent.click(screen.getByRole("button", { name: "Выделить все" }));

    expect(onChange).toHaveBeenCalledWith(ALL_THEME_SLUGS);
    expect(new Set(onChange.mock.calls[0][0]).size).toBe(ALL_THEME_SLUGS.length);
  });

  it("removes an individual theme after select-all", () => {
    const onChange = vi.fn();
    render(
      <ThemeMultiSelect value={[...ALL_THEME_SLUGS]} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Выбрать темы" }));
    fireEvent.click(screen.getByText("Природа"));

    expect(onChange).toHaveBeenCalledWith(
      ALL_THEME_SLUGS.filter((slug) => slug !== "nature"),
    );
  });

  it("clears all selected themes", () => {
    const onChange = vi.fn();
    render(
      <ThemeMultiSelect value={[...ALL_THEME_SLUGS]} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Выбрать темы" }));
    fireEvent.click(screen.getByRole("button", { name: "Очистить" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
