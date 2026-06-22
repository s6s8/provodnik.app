import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag } from "../tag";

describe("Tag", () => {
  it("tints the primary tag with the canon primary tokens", () => {
    const { container } = render(<Tag color="primary">Горы</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-primary-tint");
    expect(tag?.className).toContain("text-primary");
  });

  it("tints the amber tag with the canon amber tokens", () => {
    const { container } = render(<Tag color="amber">Лето</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-amber-tint");
    expect(tag?.className).toContain("text-amber");
  });

  it("tints the green tag with the canon green tokens", () => {
    const { container } = render(<Tag color="green">Эко</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-green-tint");
    expect(tag?.className).toContain("text-success");
  });
});
