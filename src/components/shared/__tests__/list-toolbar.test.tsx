import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListToolbar } from "../list-toolbar";

describe("ListToolbar", () => {
  it("renders the result count", () => {
    render(<ListToolbar resultCount={24} />);
    expect(screen.getByText("Найдено 24")).not.toBeNull();
  });

  it("renders a removable filter chip and calls onClearFilter with its key", () => {
    const onClearFilter = vi.fn();
    render(
      <ListToolbar
        resultCount={3}
        activeFilters={[{ key: "type", label: "Горный поход" }]}
        onClearFilter={onClearFilter}
      />,
    );

    expect(screen.getByText("Горный поход")).not.toBeNull();

    const remove = screen.getByRole("button", { name: "Убрать фильтр" });
    fireEvent.click(remove);
    expect(onClearFilter).toHaveBeenCalledWith("type");
  });

  it("renders a sort select when sortOptions are provided", () => {
    render(
      <ListToolbar
        resultCount={5}
        sortOptions={[{ value: "new", label: "Новые" }]}
        sortValue="new"
      />,
    );

    expect(screen.getByRole("combobox")).not.toBeNull();
  });
});
