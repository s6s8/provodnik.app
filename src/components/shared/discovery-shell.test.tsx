import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DiscoveryGrid,
  DiscoveryHero,
  DiscoveryResultsCount,
  DiscoveryShell,
} from "./discovery-shell";

describe("DiscoveryHero", () => {
  it("renders the page title as the H1 and the search slot", () => {
    render(
      <DiscoveryHero imageUrl="grad" title="Запросы" intro="Подзаголовок">
        <input aria-label="Поиск" />
      </DiscoveryHero>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Запросы" })).toBeInTheDocument();
    expect(screen.getByText("Подзаголовок")).toBeInTheDocument();
    expect(screen.getByLabelText("Поиск")).toBeInTheDocument();
  });
});

describe("DiscoveryGrid", () => {
  it("uses the shared 1/2/3-column responsive grid rhythm", () => {
    const { container } = render(
      <DiscoveryGrid>
        <div>card</div>
      </DiscoveryGrid>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });

  it("merges caller classes onto the grid", () => {
    const { container } = render(<DiscoveryGrid className="gap-6">x</DiscoveryGrid>);
    expect((container.firstElementChild as HTMLElement).className).toContain("gap-6");
  });
});

describe("DiscoveryShell", () => {
  it("wraps content in the shared max-width discovery column", () => {
    const { container } = render(<DiscoveryShell>body</DiscoveryShell>);
    expect((container.firstElementChild as HTMLElement).className).toContain("max-w-page");
  });
});

describe("DiscoveryResultsCount", () => {
  it("pluralises the Russian count noun", () => {
    render(<DiscoveryResultsCount count={5} noun={["гид", "гида", "гидов"]} />);
    expect(screen.getByText("Найдено 5 гидов")).toBeInTheDocument();
  });

  it("uses the singular form for one", () => {
    render(<DiscoveryResultsCount count={1} noun={["гид", "гида", "гидов"]} />);
    expect(screen.getByText("Найдено 1 гид")).toBeInTheDocument();
  });
});
