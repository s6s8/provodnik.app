import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListHero } from "./list-hero";

describe("ListHero", () => {
  it("renders the title heading", () => {
    render(<ListHero imageUrl="/photo.jpg" title="Готовые экскурсии" />);

    expect(screen.getByRole("heading", { name: "Готовые экскурсии" })).toBeInTheDocument();
  });

  it("renders the intro when provided", () => {
    render(
      <ListHero imageUrl="/photo.jpg" title="Готовые экскурсии" intro="Найдите гида под свой запрос." />,
    );

    expect(screen.getByText("Найдите гида под свой запрос.")).toBeInTheDocument();
  });

  it("renders a child search node passed in", () => {
    render(
      <ListHero imageUrl="/photo.jpg" title="Готовые экскурсии">
        <input type="search" placeholder="Поиск" />
      </ListHero>,
    );

    expect(screen.getByPlaceholderText("Поиск")).toBeInTheDocument();
  });

  it("sets the background image style and aria-label on the photo layer", () => {
    render(<ListHero imageUrl="/photo.jpg" imagePosition="center 30%" title="Готовые экскурсии" />);

    const photo = screen.getByRole("img", { name: "Готовые экскурсии" });
    expect(photo).toHaveStyle({ backgroundImage: "url('/photo.jpg')" });
    expect(photo).toHaveStyle({ backgroundPosition: "center 30%" });
  });

  it("does not use the off-canon dark inline scrim", () => {
    const { container } = render(<ListHero imageUrl="/photo.jpg" title="Готовые экскурсии" />);

    expect(container.innerHTML).not.toContain("rgba(8,14,24");
  });

  it("uses the canon hero-overlay scrim", () => {
    const { container } = render(<ListHero imageUrl="/photo.jpg" title="Готовые экскурсии" />);

    expect(container.querySelector(".hero-overlay")).not.toBeNull();
  });

  it("top-bleeds under the nav by cancelling the layout pt-nav-h", () => {
    const { container } = render(<ListHero imageUrl="/photo.jpg" title="Готовые экскурсии" />);

    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section).toHaveClass("-mt-nav-h");
  });
});
