import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "../skeleton";

describe("Skeleton variant presets", () => {
  it("applies the card preset radius", () => {
    const { container } = render(<Skeleton variant="card" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');

    expect(skeleton?.className).toContain("rounded-lg");
  });

  it("applies the avatar preset shape and size", () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');

    expect(skeleton?.className).toContain("rounded-full");
    expect(skeleton?.className).toContain("size-[46px]");
  });

  it("applies the hero preset radius", () => {
    const { container } = render(<Skeleton variant="hero" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');

    expect(skeleton?.className).toContain("rounded-hero");
  });
});
