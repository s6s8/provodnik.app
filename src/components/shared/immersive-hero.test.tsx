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

  it("shrinks the hero and the title in the compact variant", () => {
    const { container } = render(
      <ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" variant="compact" />,
    );

    // Both the photo frame and the content rail shrink together.
    expect(container.querySelectorAll(".sm\\:min-h-\\[320px\\]")).toHaveLength(2);
    expect(container.querySelector(".sm\\:min-h-\\[632px\\]")).not.toBeInTheDocument();
    expect(container.querySelector("h1")).toHaveClass("text-[clamp(30px,4.5vw,44px)]");
    expect(container.querySelector("h1")).not.toHaveClass("text-[clamp(46px,7vw,74px)]");
  });

  it("keeps the full-height sizing in the default variant", () => {
    const { container } = render(<ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />);

    expect(container.querySelectorAll(".sm\\:min-h-\\[632px\\]")).toHaveLength(2);
    expect(container.querySelector("h1")).toHaveClass("text-[clamp(46px,7vw,74px)]");
  });

  it("renders real photos through next/image with priority", () => {
    const { container } = render(
      <ImmersiveHero imageUrl="/photo.jpg" title="Озеро Байкал" />,
    );

    const photo = screen.getByRole("img", { name: "Озеро Байкал" });
    expect(photo.tagName).toBe("IMG");
    expect(photo.getAttribute("src")).toContain("photo.jpg");
    expect(container.querySelector(".scrim-hero")).toBeInTheDocument();
  });

  it("falls back to a CSS background variable for gradient data URLs", () => {
    const gradient = "data:image/svg+xml,gradient";
    render(<ImmersiveHero imageUrl={gradient} title="Озеро Байкал" />);

    const photo = screen.getByRole("img", { name: "Озеро Байкал" });
    expect(photo).toHaveStyle({ "--hero-img": `url('${gradient}')` });
  });

  // The two halves of the bleed contract used to live in different files: the page
  // cancelled the layout's header padding with -mt-nav-h, while the hero reserved
  // the header band only below md (md:pt-0). At md+ nothing reserved it, so a panel
  // taller than the hero had its top painted over by the fixed header — and clipped
  // by overflow-hidden, so it could not even be scrolled into view. One prop now
  // owns both halves: you cannot cancel the padding without reserving the band.
  describe("navBleed", () => {
    it("reserves the header band at every width when the hero bleeds under the nav", () => {
      const { container } = render(
        <ImmersiveHero imageUrl="/photo.jpg" title="Элиста" navBleed />,
      );

      const section = container.querySelector("section");
      expect(section).toHaveClass("-mt-nav-h");

      const rail = container.querySelector('[class*="pt-[calc(var(--nav-h)"]');
      expect(rail).not.toBeNull();
      // The guard must survive at md+ — this is the actual regression.
      expect(rail?.className).not.toContain("md:pt-0");
    });

    it("does not cancel the layout padding when the hero does not bleed", () => {
      const { container } = render(<ImmersiveHero imageUrl="/photo.jpg" title="Элиста" />);

      expect(container.querySelector("section")).not.toHaveClass("-mt-nav-h");
      // Heroes that start below the header keep their existing md rail.
      const rail = container.querySelector('[class*="pt-[calc(var(--nav-h)"]');
      expect(rail?.className).toContain("md:pt-0");
    });
  });
});
