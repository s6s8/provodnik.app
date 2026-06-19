import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicGuideCard } from "./public-guide-card";

describe("PublicGuideCard", () => {
  it("renders the name, rating and links to the guide page", () => {
    render(
      <PublicGuideCard
        slug="tamar"
        fullName="Тамар Гелашвили"
        initials="ТГ"
        rating={4.8}
        reviewCount={12}
        verified
      />,
    );

    const link = screen.getByRole("link", { name: /Тамар Гелашвили/ });
    expect(link).toHaveAttribute("href", "/guides/tamar");
    expect(screen.getByText("Тамар Гелашвили")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText(/12 отзывов/)).toBeInTheDocument();
    expect(screen.queryByText("Новый гид")).not.toBeInTheDocument();
  });

  it("shows the new-but-vetted state instead of a zero rating", () => {
    const { container } = render(
      <PublicGuideCard slug="oleg" fullName="Олег Иванов" initials="ОИ" rating={0} reviewCount={0} verified />,
    );

    expect(screen.getByText("Новый гид")).toBeInTheDocument();
    expect(container.textContent).not.toContain("★0");
    expect(container.textContent).not.toContain("0.0");
  });
});
