import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DiscoveryFilterSheet } from "./discovery-filter-sheet";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function openMobileSheet() {
  const triggers = screen.getAllByRole("button", { name: /Фильтры/i });
  fireEvent.click(triggers[triggers.length - 1]);
  return screen.getByRole("dialog");
}

describe("DiscoveryFilterSheet mobile sheet", () => {
  it("caps sheet height and keeps filter body scrollable on short viewports", () => {
    render(
      <DiscoveryFilterSheet title="Фильтры" description="Уточните город и даты">
        {() => <div data-testid="filter-body">Содержимое фильтров</div>}
      </DiscoveryFilterSheet>,
    );

    const dialog = openMobileSheet();
    const sheetContent = dialog.closest('[data-slot="sheet-content"]') ?? dialog;

    expect(sheetContent.className).toMatch(/max-h-\[85vh\]/);
    expect(sheetContent.className).toMatch(/flex-col/);

    const scrollRegion = within(dialog).getByTestId("filter-body").parentElement;
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion!.className).toMatch(/min-h-0/);
    expect(scrollRegion!.className).toMatch(/flex-1/);
    expect(scrollRegion!.className).toMatch(/overflow-y-auto/);
  });

  it("keeps the done control focusable for keyboard users inside the sheet", () => {
    const onDone = vi.fn();
    render(
      <DiscoveryFilterSheet title="Фильтры" description="Уточните город и даты">
        {(close) => (
          <>
            <input aria-label="Поиск города" />
            <button type="button" onClick={() => (onDone(), close())}>
              Готово
            </button>
          </>
        )}
      </DiscoveryFilterSheet>,
    );

    const dialog = openMobileSheet();
    const doneButton = within(dialog).getByRole("button", { name: "Готово" });
    const cityInput = within(dialog).getByRole("textbox", { name: "Поиск города" });

    expect(doneButton).not.toHaveAttribute("tabindex", "-1");
    expect(cityInput).not.toHaveAttribute("tabindex", "-1");

    doneButton.focus();
    expect(doneButton).toHaveFocus();

    fireEvent.click(doneButton);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
