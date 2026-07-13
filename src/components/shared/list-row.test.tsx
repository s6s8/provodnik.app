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

  it("keeps actions outside the link when href and actions coexist", () => {
    render(
      <ListRow
        href="/admin/bookings/abc"
        title="Заявка"
        actions={
          <form>
            <button type="submit">Подтвердить</button>
          </form>
        }
      />,
    );

    const link = screen.getByRole("link", { name: "Заявка" });
    expect(link).toHaveAttribute("href", "/admin/bookings/abc");
    // The action button must not be a descendant of the anchor (invalid HTML,
    // and the browser would swallow the click).
    expect(link).not.toContainElement(
      screen.getByRole("button", { name: "Подтвердить" }),
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
