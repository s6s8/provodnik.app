import { render } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders an svg icon, the title and a typed action link", () => {
    const { container, getByText } = render(
      <EmptyState
        icon={Search}
        title="Ничего не найдено"
        action={{ label: "Создать запрос", href: "/requests/new" }}
      />
    );

    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByText("Ничего не найдено")).toBeTruthy();

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/requests/new");
    expect(link?.textContent).toBe("Создать запрос");
  });

  it("renders no link when no action is provided", () => {
    const { container } = render(
      <EmptyState icon={Search} title="Ничего не найдено" />
    );

    expect(container.querySelector("a")).toBeNull();
  });

  it("renders the description when provided", () => {
    const { getByText } = render(
      <EmptyState
        icon={Search}
        title="Ничего не найдено"
        description="Попробуйте изменить фильтры"
      />
    );

    expect(getByText("Попробуйте изменить фильтры")).toBeTruthy();
  });

  it("tints the icon circle per iconColor", () => {
    const { container } = render(
      <EmptyState icon={Search} title="Готово" iconColor="green" />
    );
    const circle = container.querySelector('[data-slot="empty-state-icon"]');

    expect(circle?.className).toContain("bg-green-tint");
    expect(circle?.className).toContain("text-success");
  });
});
