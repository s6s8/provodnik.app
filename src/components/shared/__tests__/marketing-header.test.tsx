import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHeader } from "../marketing-header";

describe("MarketingHeader", () => {
  it("renders the title as a white H1", () => {
    const { getByText } = render(<MarketingHeader title="Групповые туры для бизнеса" />);

    const heading = getByText("Групповые туры для бизнеса");
    expect(heading.tagName).toBe("H1");
    expect(heading.className).toContain("text-white");
  });

  it("renders a photo image and a scrim when photo is provided", () => {
    const { container } = render(
      <MarketingHeader title="Эльбрус" photo="/photo.jpg" />,
    );

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/photo.jpg");

    const scrim = container.querySelector(".bg-gradient-to-t");
    expect(scrim).not.toBeNull();
  });

  it("renders the eyebrow as a Badge variant=eyebrow", () => {
    const { container } = render(
      <MarketingHeader title="Эльбрус" eyebrow="Для бизнеса" />,
    );

    const eyebrow = container.querySelector('[data-slot="badge"][data-variant="eyebrow"]');
    expect(eyebrow?.textContent).toBe("Для бизнеса");
  });

  it("renders the CTA as a link with label and href", () => {
    const { getByText } = render(
      <MarketingHeader title="Эльбрус" cta={{ label: "Оставить заявку", href: "/requests/new" }} />,
    );

    const link = getByText("Оставить заявку").closest("a");
    expect(link?.getAttribute("href")).toBe("/requests/new");
  });
});
