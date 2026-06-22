import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../button";

describe("Button", () => {
  it("shows a spinner and busy/disabled state when loading", () => {
    const { container, getByText } = render(<Button loading>Сохранить</Button>);
    const button = container.querySelector('[data-slot="button"]');

    expect(button?.getAttribute("aria-busy")).toBe("true");
    expect(button?.hasAttribute("disabled")).toBe(true);
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
    expect(getByText("Сохранить")).toBeTruthy();
  });

  it("renders no spinner and no busy state by default", () => {
    const { container } = render(<Button>Сохранить</Button>);
    const button = container.querySelector('[data-slot="button"]');

    expect(button?.hasAttribute("aria-busy")).toBe(false);
    expect(button?.hasAttribute("disabled")).toBe(false);
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });
});
