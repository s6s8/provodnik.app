import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "../badge";

describe("Badge", () => {
  it("renders sentence-case by default (no uppercase shout)", () => {
    const { container } = render(<Badge>Подтверждено</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge?.className).not.toContain("uppercase");
  });

  it("uppercases the eyebrow variant", () => {
    const { container } = render(<Badge variant="eyebrow">Маршрут</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge?.className).toContain("uppercase");
  });

  it("tints the success variant with the canon green token", () => {
    const { container } = render(<Badge variant="success">Готово</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge?.className).toContain("bg-green-tint");
  });

  it("tints the warning variant with the canon amber token", () => {
    const { container } = render(<Badge variant="warning">Внимание</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge?.className).toContain("bg-amber-tint");
  });

  it("tints the info variant with the canon primary token", () => {
    const { container } = render(<Badge variant="info">Инфо</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge?.className).toContain("bg-primary-tint");
  });
});
