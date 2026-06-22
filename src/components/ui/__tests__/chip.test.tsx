import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "../chip";

describe("Chip", () => {
  it("renders the key as an uppercase muted eyebrow", () => {
    const { getByText } = render(<Chip label="Длительность" value="3 дня" />);
    const key = getByText("Длительность");

    expect(key.className).toContain("uppercase");
    expect(key.className).toContain("text-muted-foreground");
  });

  it("renders the value in the on-surface ink token", () => {
    const { getByText } = render(<Chip label="Длительность" value="3 дня" />);
    const value = getByText("3 дня");

    expect(value.className).toContain("text-on-surface");
  });

  it("wraps content in a hairline-bordered pill", () => {
    const { container } = render(<Chip label="Длительность" value="3 дня" />);
    const chip = container.querySelector('[data-slot="chip"]');

    expect(chip?.className).toContain("border-line");
    expect(chip?.className).toContain("rounded-full");
  });
});
