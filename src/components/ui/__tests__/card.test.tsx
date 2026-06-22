import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "../card";

describe("Card", () => {
  it("renders the flat Clean-Trust variant by default", () => {
    const { container } = render(<Card>Контент</Card>);
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).toContain("bg-card");
    expect(card?.className).toContain("border-line");
    expect(card?.className).toContain("rounded-lg");
    expect(card?.className).toContain("shadow-soft");
    expect(card?.className).not.toContain("bg-glass");
  });

  it("keeps glass as opt-in via variant", () => {
    const { container } = render(<Card variant="glass">Контент</Card>);
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).toContain("bg-glass");
    expect(card?.className).toContain("shadow-glass");
    expect(card?.className).toContain("rounded-glass");
    expect(card?.className).not.toContain("bg-card");
  });

  it("widens vertical padding with padding=lg", () => {
    const { container } = render(<Card padding="lg">Контент</Card>);
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).toContain("py-6");
  });

  it("drops the shadow when shadow is false", () => {
    const { container } = render(<Card shadow={false}>Контент</Card>);
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).not.toContain("shadow-soft");
    expect(card?.className).not.toContain("shadow-glass");
  });

  it("drops the border when border is false", () => {
    const { container } = render(<Card border={false}>Контент</Card>);
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).not.toContain("border-line");
  });
});
