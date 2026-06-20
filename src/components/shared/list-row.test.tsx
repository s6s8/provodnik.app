import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { ListRow } from "./list-row";

describe("ListRow", () => {
  it("renders title, subtitle and badge", () => {
    render(
      <ListRow
        title="Экскурсия по Казани"
        subtitle="12 июня · 4 человека"
        badge={<Badge>Активна</Badge>}
      />,
    );

    expect(screen.getByText("Экскурсия по Казани")).toBeInTheDocument();
    expect(screen.getByText("12 июня · 4 человека")).toBeInTheDocument();
    expect(screen.getByText("Активна")).toBeInTheDocument();
  });

  it("renders a link covering the row when href is set", () => {
    render(<ListRow href="/requests/abc" title="Заявка" />);

    expect(screen.getByRole("link", { name: "Заявка" })).toHaveAttribute(
      "href",
      "/requests/abc",
    );
  });

  it("does not bubble action clicks to the row", () => {
    const onRow = vi.fn();
    const onAction = vi.fn();

    render(
      <ListRow
        title="Заявка"
        onClick={onRow}
        actions={
          <button type="button" onClick={onAction}>
            Отменить
          </button>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Отменить" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onRow).not.toHaveBeenCalled();
  });
});
