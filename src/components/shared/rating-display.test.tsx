import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RatingDisplay } from "./rating-display";

describe("RatingDisplay", () => {
  it("shows the 'Новый гид' chip and no star when there are no reviews", () => {
    const { container } = render(<RatingDisplay rating={0} reviewCount={0} />);

    expect(screen.getByText("Новый гид")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("0.0");
    expect(container.textContent).not.toContain("★");
  });

  it("adds the verified marker for a new but vetted guide", () => {
    render(<RatingDisplay rating={null} reviewCount={null} verified />);

    expect(screen.getByText("Новый гид")).toBeInTheDocument();
    expect(screen.getByText("Проверен")).toBeInTheDocument();
  });

  it("renders the star, rating and review count when reviews exist", () => {
    const { container } = render(<RatingDisplay rating={4.7} reviewCount={3} />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("4.7");
    expect(container.textContent).toContain("3 отзыва");
    expect(screen.queryByText("Новый гид")).not.toBeInTheDocument();
  });
});
