import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiscoverySearchInput } from "./discovery-search-input";

describe("DiscoverySearchInput", () => {
  it("renders a type=search input with the shared visual style", () => {
    render(<DiscoverySearchInput aria-label="Поиск" placeholder="Найти" />);

    const input = screen.getByRole("searchbox", { name: "Поиск" });
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("placeholder", "Найти");
    // Identical baseline class on every discovery page.
    expect(input.className).toContain("h-12");
    expect(input.className).toContain("rounded-step");
    expect(input.className).toContain("bg-surface");
    expect(input.className).toContain("pl-11");
    expect(input.className).toContain("shadow-lg");
  });

  it("renders a fixed-size search icon", () => {
    const { container } = render(<DiscoverySearchInput aria-label="Поиск" />);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("class")).toContain("size-5");
  });

  it("binds an sr-only label to the input when label is provided", () => {
    render(<DiscoverySearchInput id="dest-search" label="Поиск направления" />);

    const input = screen.getByLabelText("Поиск направления");
    expect(input).toHaveAttribute("id", "dest-search");
  });
});
