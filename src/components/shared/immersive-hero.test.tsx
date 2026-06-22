import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImmersiveHero } from "./immersive-hero";

describe("ImmersiveHero", () => {
  it("renders the title heading", () => {
    const { container } = render(<ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />);

    expect(screen.getByRole("heading", { name: "Озеро Байкал" })).toBeInTheDocument();
    expect(container.querySelector("h1")).toHaveClass("font-extrabold");
  });

  it("renders the statusBadge node when passed", () => {
    render(
      <ImmersiveHero
        imageUrl="/photo.jpg"
        title="Озеро Байкал"
        statusBadge={<span>Набор открыт</span>}
      />,
    );

    expect(screen.getByText("Набор открыт")).toBeInTheDocument();
  });

  it("renders the grain layer by default", () => {
    const { container } = render(<ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />);

    expect(container.querySelector(".hero-grain")).toBeInTheDocument();
  });

  it("omits the grain layer when grain={false}", () => {
    const { container } = render(
      <ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" grain={false} />,
    );

    expect(container.querySelector(".hero-grain")).not.toBeInTheDocument();
  });

  it("applies the taller min-height class", () => {
    const { container } = render(<ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />);

    expect(container.querySelector(".sm\\:min-h-\\[632px\\]")).toBeInTheDocument();
  });

  it("exposes the dynamic background image via a CSS variable", () => {
    const { container } = render(
      <ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />,
    );

    const photo = screen.getByRole("img", { name: "Озеро Байкал" });
    expect(photo).toHaveStyle({ "--hero-img": "url('/photo.jpg')" });
    expect(container.querySelector(".hero-overlay")).toBeInTheDocument();
  });
});
