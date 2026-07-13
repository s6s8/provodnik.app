import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag } from "../tag";

// Tag is now a thin wrapper over Badge (T-27). The tints are unchanged; the TEXT
// tones moved to the AA-safe tokens — `text-amber` on `bg-amber-tint` was 2.5:1
// and `text-success` on `bg-green-tint` was 3.5:1.
describe("Tag", () => {
  it("tints the primary tag with the canon primary tokens", () => {
    const { container } = render(<Tag color="primary">Горы</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-primary-tint");
    expect(tag?.className).toContain("text-primary");
  });

  it("tints the amber tag with the canon amber tokens and AA text", () => {
    const { container } = render(<Tag color="amber">Лето</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-amber-tint");
    expect(tag?.className).toContain("text-warning-text");
  });

  it("tints the green tag with the canon green tokens and AA text", () => {
    const { container } = render(<Tag color="green">Эко</Tag>);
    const tag = container.querySelector('[data-slot="tag"]');

    expect(tag?.className).toContain("bg-green-tint");
    expect(tag?.className).toContain("text-success-text");
  });
});
